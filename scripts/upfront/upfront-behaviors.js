(function ($) {

var LayoutEditor = {
	create_mergeable: function () {
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
		var app = this,
			models = [],
			region = app.layout.get("regions").active_region
			collection = (region ? region.get("modules") : false)
		;
		if (collection) $(".upfront-region").selectable({
			filter: ".upfront-module",
			stop: function () {
				if ($(".ui-selected").length < 2) return false;
				$(".ui-selected").each(function () {
					var $node = $(this),
						element_id = $node.attr("id"),
						model = collection.get_by_element_id(element_id)
					;
					if (model && model.get && !model.get("name")) models.push(model);
					else $node.removeClass("ui-selected");
				});
				$(".upfront-active_entity").removeClass("upfront-active_entity");
				$(".ui-selected").removeClass("ui-selected").addClass("upfront-active_entity");
				if (!models.length) return false;

				// @TODO: refactor this!
				app.command_view.commands.push(new Upfront.Views.Editor.Command_Merge({"model": _.extend({}, app.layout, {"merge": models})}));
				app.command_view.render();
			}
		});
	},


	destroy_mergeable: function () {
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
	},


	create_resizable: function (view, model) {
		$(".ui-resizable").each(function () {
			$(this).resizable("destroy");
		});
		// Don't allow reiszing on non-desktop layouts
		if (!$(Upfront.Settings.LayoutEditor.Selectors.main).is(".desktop")) return false;

		// - Resizable - snap to base grid and replace size with class on release
		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			main_width = $main.width() || 210,
			$parent = view.$el,
			parent_width = $parent.width() || 100,
			GRID_SIZE = Upfront.Settings.LayoutEditor.Grid.size,
			BASELINE = Upfront.Settings.LayoutEditor.Grid.baseline,
			$resizable = view.$el.find(">.upfront-editable_entity"),
			grid_selector = _.range(1, GRID_SIZE+1).map(function(i){ return '.'+Upfront.Settings.LayoutEditor.Grid.class+i }).join(',');
		;
		if ($resizable.resizable) $resizable.resizable({
			"containment": "parent",
			/*"grid": [parseInt(main_width/GRID_SIZE, 10), BASELINE],*/ // @TODO this doesn't work well with box-sizing: border-box that we use, disable it for now and might need nicer custom coding grid snapping
			start: function (e, ui) {
				var $el = ui.element,
					classes = view.model.get_property_value_by_name('class');
				// retain width on grid elements, so it remains fixed during resize
				$el.find(grid_selector).each(function(){
					$(this).css({
						'width': parseInt($(this).outerWidth())+'px',
						'margin-left': parseInt($(this).outerWidth(true)-$(this).outerWidth())+'px'
					});
				});
				view.$el.append('<div class="upfront-preview-helper '+classes+'" style="height:'+$el.outerHeight()+'px;"></div>');
			},
			stop: function (e, ui) {
				var $el = ui.element,
					diff = $el.outerWidth() / main_width,
					classNum = parseInt(Math.round((diff > 1 ? 1 : diff) * GRID_SIZE), 10),
					className = Upfront.Settings.LayoutEditor.Grid.class + classNum,
					prop = model.replace_class(className),
					relative_percentage = 100 * (classNum/GRID_SIZE)
				;
				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				// @TODO this is temporary hack, we need to somehow retain height and snap it to baseline
				$el.css({
					'width': '',
					'height': '',
					'position': '',
					'top': '',
					'left': ''
				});
				view.trigger("upfront:entity:resize", classNum, relative_percentage);
				// remove width on stop
				$el.find(grid_selector).css({
					'width': '',
					'margin-left': ''
				});
				view.$el.find('.upfront-preview-helper').remove();
			},
			resize: function (e, ui) {
				// Hack for better resize behavior
				var $el = ui.element,
					$preview = view.$el.find('.upfront-preview-helper'),
					diff = ui.size.width / main_width,
					classNum = parseInt(Math.round((diff > 1 ? 1 : diff) * GRID_SIZE), 10),
					className = Upfront.Settings.LayoutEditor.Grid.class + classNum,
					replace_rx = new RegExp(Upfront.Settings.LayoutEditor.Grid.class+'\\d+');
				$el.height((ui.size.height > 5 ? ui.size.height : 0) || ui.originalSize.height)
					.width(ui.size.width > parent_width ? parent_width : ui.size.width);
				$preview.height($el.outerHeight()).attr('class', $preview.attr('class').replace(replace_rx, className));
			}
		});
	},


	create_sortable: function (view, model) {
		//$(".ui-draggable").draggable("destroy"); // Draggables destroying in this way breaks Chrome
		// Don't allow sorting on non-desktop layouts
		if (!$(Upfront.Settings.LayoutEditor.Selectors.main).is(".desktop")) return false;

		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			main_pos = $main.offset(),
			main_limit = [main_pos.left, main_pos.left+$main.outerWidth()],
			$containment = view.$el.find(".upfront-editable_entity:first").is(".upfront-object") ? view.$el.parents(".upfront-editable_entities_container:first") : view.$el.parents(".upfront-region:first"),
			containment_pos = $containment.offset(),
			containment_limit = [containment_pos.left, containment_pos.left+$containment.outerWidth()],
			$draggable = view.$el.find(">.upfront-editable_entity"),
			$target = view.$el.find(">.upfront-editable_entity:first"),
			margin_left_class = Upfront.Settings.LayoutEditor.Grid.left_margin_class,
			margin_right_class = Upfront.Settings.LayoutEditor.Grid.right_margin_class,
			margin_top_class = Upfront.Settings.LayoutEditor.Grid.top_margin_class,
			margin_bottom_class = Upfront.Settings.LayoutEditor.Grid.bottom_margin_class,
			width_class = Upfront.Settings.LayoutEditor.Grid.class
			tmp = view.$el.append("<div id='upfront-temp-measurement' class='" + margin_left_class + "1 " + width_class + "1' />"),
			$measure = $("#upfront-temp-measurement"),
			margin_increment = parseFloat($("#upfront-temp-measurement").css("margin-left"), 10),
			margin_left_rx = new RegExp('\\b' + margin_left_class + '\\d+'),
			margin_right_rx = new RegExp('\\b' + margin_right_class + '\\d+'),
			margin_top_rx = new RegExp('\\b' + margin_top_class + '\\d+'),
			margin_bottom_rx = new RegExp('\\b' + margin_bottom_class + '\\d+'),
			GRID_SIZE = Upfront.Settings.LayoutEditor.Grid.size,
			BASELINE = Upfront.Settings.LayoutEditor.Grid.baseline,
			app = this,
			
			// Keep tracking of variables
			elements_pos = [],
			pos_tolerance = 50,
			
					
			// Some functions
			_update_margin_class = function ($el, margin_class, margin_size) {
				var rx = new RegExp('\\b' + margin_class + '\\d+');
				if ( ! $el.hasClass(margin_class+margin_size) ){
					if ( $el.attr('class').match(rx) )
						$el.attr('class', $el.attr('class').replace(rx, margin_class+margin_size));
					else
						$el.addClass(margin_class+margin_size);
				}
			},
			_update_margin_classes = function ($el) {
				var el_margin = $el.data('margin');
				_update_margin_class($el, margin_left_class, el_margin.current.left);
				_update_margin_class($el, margin_right_class, el_margin.current.right);
			},
			_update_elements_pos = function () {
				elements_pos = Upfront.Behaviors.LayoutEditor._generate_elements_position(view.$el.parent().children());
			},
			_update_margin_data = function () {
				Upfront.Behaviors.LayoutEditor._generate_elements_margin_data(view.$el.parent().children());
			},
			_get_direction = function ($el, pos_x, pos_y) {
				// Credit: http://stackoverflow.com/a/3647634
				/** the width and height of the current div **/
				var w = $el.outerWidth(),
					h = $el.outerHeight(),
					offset = $el.offset(),
				/** calculate the x and y to get an angle to the center of the div from that x and y. **/
				/** gets the x value relative to the center of the DIV and "normalize" it **/
					x = (pos_x - offset.left - (w/2)) * ( w > h ? (h/w) : 1 ),
					y = (pos_y - offset.top  - (h/2)) * ( h > w ? (w/h) : 1 ),
				
				/** the angle and the direction from where the mouse came in/went out clockwise (TRBL=0123);**/
				/** first calculate the angle of the point, 
				 add 180 deg to get rid of the negative values
				 divide by 90 to get the quadrant
				 add 3 and do a modulo by 4  to shift the quadrants to a proper clockwise TRBL (top/right/bottom/left) **/
					direction = Math.round((((Math.atan2(y, x) * (180 / Math.PI)) + 180 ) / 90 ) + 3 )  % 4;
				return direction; // 0 = top, 1 = right, 2 = bottom, 3 = left
			}
		;
		
		$measure.remove();

		if ($draggable.draggable) $draggable.draggable({
			//containment: $containment,
			revert: true,
			revertDuration: 1,
			zIndex: 100,
			helper: 'clone',
			start: function (e, ui) {
				var 
					$el = view.$el,
					$me = $el.find(">.upfront-editable_entity:first"),
					height = $me.outerHeight(),
					width = $me.outerWidth(),
					classes = view.model.get_property_value_by_name('class')
				;
				
				
				_update_elements_pos(); // Generate list of elements and it's position
				_update_margin_data(); // Generate margin data
				
				// debug info
				_.each(elements_pos, function(each){
					each.$el.find(".upfront-debug-info").text('current offset: '+each.position.left+','+each.outer_position.top+','+each.position.right+','+each.outer_position.bottom);
				});
				
				$me.hide();
				$el.append('<div class="upfront-preview-helper '+classes+'" style="height:'+height+'px;"></div>');
			},
			drag: function (e, ui) {
				// Set up collection position
				var 
					$el = view.$el,
					$me = $el.find(">.upfront-editable_entity:first"),
					$helper = $el.find(">.ui-draggable-dragging"),
					$preview = $el.find(">.upfront-preview-helper"),
					$prevs = $el.prevAll(),
					$nexts = $el.nextAll(),
					
					height = $me.outerHeight(),
					width = $me.outerWidth(),

					/*original_left = ui.originalPosition.left,
					original_top = ui.originalPosition.top,
					ui_left = ui.position.left,
					ui_top = ui.position.top,

					relative_left = original_left - ui_left,
					relative_top = original_top - ui_top,*/

					current_offset = $helper.offset(),
					current_left = current_offset.left,
					current_top = current_offset.top,
					current_bottom = current_top+height,
					current_right = current_left+width,
					current_x = current_left+(width/2),
					current_y = current_top+(height/2),
					
					// Find the previous or next element
					me_pos = _.find(elements_pos, function(each){
						return ( $me.attr('id') == each.$el.attr('id') );
					}),
					filtered_elements_pos = _.reject(elements_pos, function(each){
						return ( each == me_pos );
					}),
					lines = _.groupBy(filtered_elements_pos, function(each){ return each.outer_position.top; }),
					//lines_pos = [],
					lines_pos = _.keys(lines),
					next_line = _.find(lines, function(els, top){
						top = parseInt(top);
						first_top = parseInt(lines_pos[0]);
						if ( current_top < top && (top == first_top || (top > first_top && top-current_top <= pos_tolerance)) && top != me_pos.outer_position.top )
							return true;
						return false;
					}),
					current_line = lines[_.find(lines_pos, function(line, index, list){
						if ( index < list.length-1 && line <= current_top && list[index+1] > current_top )
							return true;
						if ( line == me_pos.outer_position.top || index == list.length-1 )
							return true;
						return false;
					})],
					use_line = next_line ? next_line : current_line,
					next = _.find(use_line, function(each, index, list){
						if ( current_left < each.position.left && each.position.bottom > current_top )
							return true;
						if ( next_line && index == list.length-1 )
							return true;
						return false;
					}),
					next_index = next ? _.indexOf(filtered_elements_pos, next) : false,
					prev = next_index > 0 ? filtered_elements_pos[next_index-1] : ( next_index === 0 ? false : _.last(use_line)),
					prev_index = prev ? _.indexOf(filtered_elements_pos, prev) : false,
					
					// Finding the closest element
					closest = _.min(filtered_elements_pos, function(each){
						var diff_x = each.center.x - current_x,
							diff_y = each.center.y - current_y;
						return Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y, 2));
					}),
					closest_index = _.indexOf(filtered_elements_pos, closest),
					closest_next = filtered_elements_pos.length-1 > closest_index ? filtered_elements_pos[closest_index+1] : false,
					closest_prev = closest_index > 0 ? filtered_elements_pos[closest_index-1] : false,
					
					// Figure out the margin
					margin_data = $me.data('margin'),
					
					relative_left = me_pos.position.left - current_left,
					relative_top = me_pos.position.top - current_top,
					
					relative_margin_size = -1 * (relative_left ? Math.round(relative_left / margin_increment) : 0),
					margin_size = margin_data.original.left + relative_margin_size,
					relative_margin_top_size = -1 * (relative_top ? Math.round(relative_top / BASELINE) : 0),
					margin_top_size = margin_data.original.top + relative_margin_top_size,
					
					// bind_(left|right)_elements will hold elements that is affected by the flow of current element
					bind_left_elements = [],
					bind_right_elements = [],
					// move_limit store the available movement on left/right
					move_limit = [containment_limit[0], containment_limit[1]],
					max_margin = 0,
					recalc_margin = false,
					
					// Get direction
					direction_next = next ? _get_direction(next.$el, current_x, current_top+pos_tolerance) : false,
					direction_prev = prev ? _get_direction(prev.$el, current_x, current_top+pos_tolerance) : false,
					direction = _get_direction(closest.$el, current_x, current_top+pos_tolerance),
					
					new_line = false,

					resort = false
				;
				
				//console.log([direction_prev, direction_next]);
				//console.log(direction);
				
				// Filter lines
				/*var tmp_bottom = -1, tmp_index = -1;
				_.each(lines, function(els, top, list){
					top = parseInt(top);
					if ( top < tmp_bottom ){
						_.each(els, function(each){ lines_pos[tmp_index].elements.push(each) });
					}
					else {
						tmp_index++;
						lines_pos[tmp_index] = {
							elements: els,
							top: top
						};
					}
					var max_bottom = parseInt(_.max(els, function(each){ return parseInt(each.outer_position.bottom); }).outer_position.bottom);
					tmp_bottom = max_bottom > tmp_bottom ? max_bottom : tmp_bottom;
					lines_pos[tmp_index].bottom = tmp_bottom;
				});*/
				
				// Figure out the move_limit as well as the bind_(left|right)_elements
				_.each(filtered_elements_pos, function(each){
					if ( (me_pos.outer_position.top <= each.outer_position.top &&
						me_pos.outer_position.bottom > each.outer_position.top) ||
						(me_pos.outer_position.top >= each.outer_position.top &&
						me_pos.outer_position.bottom < each.outer_position.bottom) ){
						if ( me_pos.position.left >= each.position.right ){
							bind_left_elements.push(each);
							if ( each.position.right > move_limit[0] )
								move_limit[0] = each.position.right;
						}
						if ( me_pos.position.right-1 <= each.position.left ){
							bind_right_elements.push(each);
							if ( each.position.left < move_limit[1] )
								move_limit[1] = each.position.left;
						}
					}
				});
				
				max_margin = Math.round((move_limit[1]-move_limit[0]-width)/margin_increment);
				
				margin_size = margin_size > 0 ? (margin_size > max_margin ? max_margin : margin_size) : 0;
				if ( margin_data.current.left != margin_size ){
					margin_data.current.left = margin_size;
					if ( bind_right_elements.length == 0 ){ // No elements on the right, adjusting margin right
						//var margin_right_size = max_margin-margin_size;
						//margin_data.current.right = margin_right_size > 0 ? margin_right_size : 0;
					}
					$me.data('margin', margin_data);
					$preview.css('left', (margin_data.current.left-margin_data.original.left)*margin_increment);
					recalc_margin = true;
				}
				margin_data.current.top = margin_top_size;
				$me.data('margin', margin_data);
				_update_margin_class($preview, margin_top_class, margin_data.current.top);
				
				if ( recalc_margin ){
					_.each(bind_right_elements, function(each){
						if ( me_pos.position.right-1 > each.outer_position.left || each.outer_position.left-me_pos.position.right > 4 )
							return false;
						var each_margin = each.$el.data('margin'),
							each_margin_size = max_margin-margin_data.current.left,
							each_margin_relative = (each.position.left > move_limit[1]) ? Math.round((each.position.left-move_limit[1])/margin_increment) : 0;
						if ( each_margin.current.left != each_margin_size+each_margin_relative ){
							each_margin.current.left = each_margin_size+each_margin_relative;
							each.$el.data('margin', each_margin);
						}
					});
				}
				
				
				//@TODO if previous element is on the same line and this is dragging to the right of it, remove margin right, just in case that the space on the right will fit this width
				//if ( prev && direction_prev == 1 ){
				//	var prev_margin = prev.$el.data('margin');
					//if ( prev_margin.current.right > 0 )
						//prev.$el.attr('class', prev.$el.attr('class').replace(margin_right_rx, margin_right_class+0))
				//}
				
				//@TODO if the margins between previous and next element have enough space to fit this width, adjust next element margin left
				
				
				if ( (prev && ! prev.$el.hasClass('upfront-prev')) || (next && ! next.$el.hasClass('upfront-next')) ){
					$('.upfront-prev, .upfront-next').removeClass('upfront-prev upfront-next');
					if (prev) prev.$el.addClass('upfront-prev');
					if (next) next.$el.addClass('upfront-next');
				}
				/*if ( !closest.$el.hasClass('upfront-prev') ){
					$('.upfront-prev').removeClass('upfront-prev');
					closest.$el.addClass('upfront-prev');
				}*/
				
				if ( next && $el.next().find(">.upfront-editable_entity:first").attr('id') != next.$el.attr('id') ){
					//new_line = true;
					next.$el.parent().before($el);
					resort = true;
				}
				else if ( prev && $el.prev().find(">.upfront-editable_entity:first").attr('id') != prev.$el.attr('id') ){
					if ( direction_prev == 2 || direction_prev == 3 )
						new_line = true;
					prev.$el.parent().after($el);
					resort = true;
				}
				
				// Find the line that contain closest element
				/*var line = _.find(lines_pos, function(l){ return _.contains(l.elements, closest); });
				switch (direction){
					case 0: // top
						// @TODO Check if this should create a new line above, or on the same line
						closest.$el.parent().before($el);
						break;
					case 1: // right
						//closest.$el.parent().after($el);
						break;
					case 2: // bottom
						// Check if this should drop to the next line, or keep in the same line
						if (line.bottom > closest.outer_position.bottom && 
							(closest.outer_position.top != line.top || 
							 closest_next.outer_position.top != closest.outer_position.top)){ // keep in the same line
							closest.$el.parent().after($el);
						}
						else { // drop to the next line
							_.last(line.elements).$el.parent().after($el);
							new_line = true;
						}
						break;
					case 3: // left
						//closest.$el.parent().before($el);
						break;
				}*/
				
				if (resort) {
					view.resort_bound_collection();
					
					if ( new_line && ! $me.hasClass('clr') ){
						$me.addClass('clr');
						$preview.addClass('clr');
					}
					else if ( $me.hasClass('clr') ) {
						$me.removeClass('clr');
						$preview.removeClass('clr');
					}
					
					// Reset margins after a fresh replace
					margin_data.current.left = 0;
					_update_margin_class($me, margin_left_class, margin_data.current.left);
					_update_margin_class($preview, margin_left_class, margin_data.current.left);
					
					margin_data.current.right = 0;
					_update_margin_class($me, margin_right_class, margin_data.current.right);
					_update_margin_class($preview, margin_right_class, margin_data.current.right);
					
					// Don't forget to set the margin
					$me.data('margin', margin_data);
						
					$preview.hide();
					$me.show();
					_update_elements_pos();
					
					// Generate margin data
					Upfront.Behaviors.LayoutEditor._generate_elements_margin_data(view.$el.parent().children());
					margin_data = $me.data('margin');
					
					// If there's elements on the right, add the width to the margin so it retain the spaces
					// @TODO maybe use temporary element instead?
					/*_.each(bind_right_elements, function(each){
						var each_margin = each.$el.data('margin'),
							each_margin_size = Math.round(width/margin_increment)+each_margin.current.left;
						each_margin.current.left = each_margin_size;
						each.$el.data('margin', each_margin);
						_update_margin_classes(each.$el);
					});*/
					
					// Occupy the rest space with right margin to push the next elements down
					/*me_pos = _.find(elements_pos, function(each){
						return ( $me.attr('id') == each.$el.attr('id') );
					});
					var margin_right_size = Math.round((containment_limit[1]-me_pos.position.right)/margin_increment);
					margin_data.current.right = margin_right_size > 0 ? margin_right_size : 0;
					_update_margin_class($me, margin_right_class, margin_data.current.right);
					_update_margin_class($preview, margin_right_class, margin_data.current.right);
					
					$me.data('margin', margin_data);
					
					_update_elements_pos();*/
					
					$me.hide();
					$preview.show();
					
					
					//$draggable.css({"destroy"});
				}
				
				$el.find(".upfront-debug-info").text('current offset: '+current_left+','+current_top+','+current_right+','+current_bottom+' | x,y: '+current_x+','+current_y+' | relative offset: '+relative_left+','+relative_top+' | margin size: '+margin_data.current.top+'/'+margin_data.current.left+','+margin_data.current.right);
				//return !resort;

			},
			stop: function (e, ui) {
				// Set up margins
				if (view.$el.is(".upfront-replaced")) {
					view.$el.removeClass("upfront-replaced");
					view.model.replace_class("ml0");
					return true;
				}
				var 
					$target = view.$el.find(">.upfront-editable_entity:first"),
					
					original_left = ui.originalPosition.left,
					original_top = ui.originalPosition.top,
					current_left = ui.position.left,
					current_top = ui.position.top,

					relative_left = original_left - current_left,
					relative_top = original_top - current_top,
					
					margin_data = $target.data('margin')
				;
				view.$el.find('.upfront-preview-helper').remove();
				view.model.replace_class(margin_left_class+margin_data.current.left);
				view.model.replace_class(margin_right_class+margin_data.current.right);
				view.model.replace_class(margin_top_class+margin_data.current.top);
				
				view.$el.parent().children().each(function(){
					var $el = $(this).find(">.upfront-editable_entity:first"),
						each_margin_data = $el.data('margin');
					if ( each_margin_data && each_margin_data.original.left != each_margin_data.current.left ){
						// @TODO Better way to get correct model instead of iterate like this?
						var modules = app.layout.get('regions').active_region.get('modules'),
							model = modules.get_by_element_id($el.attr('id'));
						if ( ! model )
							modules.each(function(module){
								var objects = module.get('objects'),
									object_model = objects.get_by_element_id($el.attr('id'));
								if ( object_model )
									model = object_model;
							});
						console.log(each_margin_data.current.left);
						model.replace_class(margin_left_class+each_margin_data.current.left);
					}
				});
				$target.show();
				//console.log(margin_increment)
				//console.log([current_margin_left_size, margin_size]);
				//console.log([relative_left, margin_pfx + margin_size])
				
				//view.resort_bound_collection();
			}
		});
	},
	
	_generate_elements_position: function (elements) {
		return _.map(elements, function(each){
					var $el = $(each).find(">.upfront-editable_entity:first"),
						top = $el.offset().top,
						left = $el.offset().left,
						outer_top = top-parseInt($el.css('margin-top')),
						outer_left = left-parseInt($el.css('margin-left'));
					return {
						$el: $el,
						position: {
							top: top,
							left: left,
							bottom: top+$el.outerHeight(),
							right: left+$el.outerWidth()
						},
						outer_position: {
							top: outer_top,
							left: outer_left,
							bottom: outer_top+$el.outerHeight(true),
							right: outer_left+$el.outerWidth(true)
						},
						width: $el.outerWidth(),
						height: $el.outerHeight(),
						center: {
							y: top+($el.outerHeight()/2),
							x: left+($el.outerWidth()/2)
						}
					};
			});
	},
	
	_generate_elements_margin_data: function (elements) {
		_.each(elements, function(each){
			var $el = $(each).find(">.upfront-editable_entity:first"),
				margin_left_class = Upfront.Settings.LayoutEditor.Grid.left_margin_class,
				margin_right_class = Upfront.Settings.LayoutEditor.Grid.right_margin_class,
				margin_top_class = Upfront.Settings.LayoutEditor.Grid.top_margin_class,
				margin_bottom_class = Upfront.Settings.LayoutEditor.Grid.bottom_margin_class,
				margin_left_rx = new RegExp('\\b' + margin_left_class + '(\\d+)'),
				margin_right_rx = new RegExp('\\b' + margin_right_class + '(\\d+)'),
				margin_top_rx = new RegExp('\\b' + margin_top_class + '(\\d+)'),
				margin_bottom_rx = new RegExp('\\b' + margin_bottom_class + '(\\d+)'),
				
				current_margin_left = $el.attr("class").match(margin_left_rx),
				current_margin_left_size = current_margin_left && current_margin_left.length ? parseInt(current_margin_left[1], 10) : 0,
	
				current_margin_right = $el.attr("class").match(margin_right_rx),
				current_margin_right_size = current_margin_right && current_margin_right.length ? parseInt(current_margin_right[1], 10) : 0,
				
				current_margin_top = $el.attr("class").match(margin_top_rx),
				current_margin_top_size = current_margin_top && current_margin_top.length ? parseInt(current_margin_top[1], 10) : 0
			;
			
			$el.data('margin', {
				original: {
					left: current_margin_left_size,
					right: current_margin_right_size,
					top: current_margin_top_size
				},
				current: {
					left: current_margin_left_size,
					right: current_margin_right_size,
					top: current_margin_top_size
				}
			});
		});
	},

	create_undo: function () {
		// @TODO Jeffri: noticed performance issue with Chrome, GC events overload in timeline when storing undo state
		this.layout.store_undo_state();
	},
	apply_history_change: function () {
		this.layout_view.render();
	}
};

define({
	"Behaviors": {
		"LayoutEditor": LayoutEditor
	}
});
})(jQuery);