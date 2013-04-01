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
			width_rx = new RegExp(Upfront.Settings.LayoutEditor.Grid.class+'(\\d+)'),
			margin_right_class = Upfront.Settings.LayoutEditor.Grid.right_margin_class,
			margin_right_rx = new RegExp(margin_right_class+'(\\d+)'),
			$resizable = view.$el.find(">.upfront-editable_entity"),
			grid_selector = _.range(1, GRID_SIZE+1).map(function(i){ return '.'+Upfront.Settings.LayoutEditor.Grid.class+i }).join(',');
		;
		if ($resizable.resizable) $resizable.resizable({
			"containment": "parent",
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
					$preview = view.$el.find('.upfront-preview-helper'),
					diff = $el.outerWidth() / main_width,
					classNum = parseInt(Math.round((diff > 1 ? 1 : diff) * GRID_SIZE), 10),
					className = Upfront.Settings.LayoutEditor.Grid.class + classNum,
					prop = model.replace_class(className),
					relative_percentage = 100 * (classNum/GRID_SIZE),
					margin_right = $preview.attr('class').match(margin_right_rx),
					margin_right_num = margin_right ? parseInt(margin_right[1]) : 0
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
				model.replace_class(margin_right_class+margin_right_num);
				view.trigger("upfront:entity:resize", classNum, relative_percentage);
				// remove width on stop
				$el.find(grid_selector).css({
					'width': '',
					'margin-left': ''
				});
				view.$el.find('.upfront-preview-helper').remove();
			},
			resize: function (e, ui) {
				var $el = ui.element,
					$preview = view.$el.find('.upfront-preview-helper'),
					preview_class = $preview.attr('class'),
					current_width = preview_class.match(width_rx),
					current_width_num = current_width ? parseInt(current_width[1]) : 1;
					diff = ui.size.width / main_width,
					classNum = parseInt(Math.round((diff > 1 ? 1 : diff) * GRID_SIZE), 10),
					className = Upfront.Settings.LayoutEditor.Grid.class + classNum,
					current_margin_right = preview_class.match(margin_right_rx),
					current_margin_right_num = current_margin_right ? parseInt(current_margin_right[1]) : 0,
					margin_right = (current_width_num+current_margin_right_num)-classNum;
				$el.height((ui.size.height > 5 ? ui.size.height : 0) || ui.originalSize.height)
					.width(ui.size.width > parent_width ? parent_width : ui.size.width);
				$preview.height($el.outerHeight())
					.attr('class', $preview.attr('class').replace(width_rx, className).replace(margin_right_rx, margin_right_class+margin_right));
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
			width_class = Upfront.Settings.LayoutEditor.Grid.class,
			margin_left_class = Upfront.Settings.LayoutEditor.Grid.left_margin_class,
			margin_right_class = Upfront.Settings.LayoutEditor.Grid.right_margin_class,
			margin_top_class = Upfront.Settings.LayoutEditor.Grid.top_margin_class,
			margin_bottom_class = Upfront.Settings.LayoutEditor.Grid.bottom_margin_class,
			width_class = Upfront.Settings.LayoutEditor.Grid.class
			tmp = view.$el.append("<div id='upfront-temp-measurement' class='" + margin_left_class + "1 " + width_class + "1' />"),
			$measure = $("#upfront-temp-measurement"),
			margin_increment = parseFloat($("#upfront-temp-measurement").css("margin-left"), 10),
			width_rx = new RegExp('\\b' + width_class + '\\d+'),
			margin_left_rx = new RegExp('\\b' + margin_left_class + '\\d+'),
			margin_right_rx = new RegExp('\\b' + margin_right_class + '\\d+'),
			margin_top_rx = new RegExp('\\b' + margin_top_class + '\\d+'),
			margin_bottom_rx = new RegExp('\\b' + margin_bottom_class + '\\d+'),
			GRID_SIZE = Upfront.Settings.LayoutEditor.Grid.size,
			BASELINE = Upfront.Settings.LayoutEditor.Grid.baseline,
			app = this,
			behavior = Upfront.Behaviors.LayoutEditor,
			
			// Keep tracking of variables
			elements_pos = [],
			pos_tolerance = 50,
			
					
			// Some functions
			_update_class = function ($el, class_name, class_size) {
				var rx = new RegExp('\\b' + class_name + '\\d+');
				if ( ! $el.hasClass(class_name+class_size) ){
					if ( $el.attr('class').match(rx) )
						$el.attr('class', $el.attr('class').replace(rx, class_name+class_size));
					else
						$el.addClass(class_name+class_size);
				}
			},
			_update_margin_classes = function ($el) {
				var el_margin = $el.data('margin');
				_update_class($el, margin_left_class, el_margin.current.left);
				_update_class($el, margin_right_class, el_margin.current.right);
			},
			_update_elements_pos = function () {
				elements_pos = behavior._generate_elements_position(view.$el.parent().children(':not(.upfront-preview-transition)'));
			},
			_update_margin_data = function () {
				behavior._generate_elements_margin_data(view.$el.parent().children(':not(.upfront-preview-transition)'));
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
			},
			_preview_t = null,
			_preview_delay = 500, // in ms
			_preview_resort = function (me, v) {
				console.log(v);
				var
					$preview = me.$el.parent().find(">.upfront-preview-helper"),
					// Get direction
					direction_next = v.next ? _get_direction(v.next.$el, v.offset.x, v.offset.top+pos_tolerance) : false,
					direction_prev = v.prev ? _get_direction(v.prev.$el, v.offset.x, v.offset.top+pos_tolerance) : false,
					direction = _get_direction(v.closest.$el, v.offset.x, v.offset.top+pos_tolerance),
					margin_data = me.$el.data('margin'),
					avail_top_width = 0,
					avail_width = 0,
					avail_space = 0,
					avail_space_left = 0,
					avail_space_right = 0,
					
					animate_duration = 200,
					
					update_class = false, // if margin class update is needed
					add_clear = false, // if clear is needed (the element moved to a new line)
					moved = false, // if it's moved
					swapped = false, // if element is swapped
					resort = false // if resort is needed
				;
				// Use next if exists and the direction is either top/left
				if ( v.next && (direction_next != 2 || v.offset.top < v.next.outer_position.top) ){
					// available width and space
					var next_affected_els = behavior._get_affected_elements(v.next, elements_pos, [me]),
						next_move_limit = behavior._get_move_limit(next_affected_els, containment_limit),
						next_margin = v.next.$el.data('margin'),
						current_direction = _get_direction(v.next.$el, me.center.x, me.position.top+pos_tolerance),
						same_line = ( me.outer_position.top == v.next.outer_position.top ),
						get_prev = v.next.$el.parent().prev(),
						is_prev = get_prev ? get_prev.find(">.upfront-editable_entity:first").attr('id') == me.$el.attr('id') : false,
						get_next = v.next.$el.parent().next(),
						is_next = !is_prev && get_next ? get_next.find(">.upfront-editable_entity:first").attr('id') == me.$el.attr('id') : false;
					console.log([current_direction, direction_next]);
					//if ( is_prev && direction_next == 3 && same_line ) // Same order and direction, no need to resort/move
					//	return;
					/*if ( _.find(next_affected_els.left, function(each){ return ( each.$el == me.$el ); }) ){ // Since the left affected elements is current element, add it's position to the move limit
						next_move_limit[0] = me.outer_position.left;
					}*/
					avail_top_width = containment_limit[1]-next_move_limit[0];
					avail_width = next_move_limit[1]-next_move_limit[0];
					avail_space = avail_width-(v.next.width);
					avail_space_left = v.next.position.left-next_move_limit[0];
					avail_space_right = avail_space-avail_space_left;
					
					if ( direction_next == 3 && avail_space_left >= me.width ) {
						if ( is_prev && same_line )
							return;
						if ( margin_data.original.left != 0 || margin_data.original.right != 0 ){
							margin_data.current.left = 0;
							margin_data.current.right = 0;
							update_class = true;
						}
						if ( v.next.outer_position.left-2 <= containment_limit[0] ){
							add_clear = true;
						}
						next_margin.current.left = Math.round((avail_space_left-me.width)/margin_increment);
						_update_class(v.next.$el, margin_left_class, next_margin.current.left);
						v.next.$el.data('margin', next_margin);
						if ( v.next.$el.hasClass('clr') )
							v.next.$el.removeClass('clr');
						moved = true;
					}
					else if ( direction_next == 3 && same_line ) {
						var next_affected_direct = behavior._get_affected_elements(v.next, elements_pos, [], true);
						if ( next_affected_direct.right > 1 )
							return;
						if ( margin_data.original.right > 0 ){
							next_margin.current.right = margin_data.original.right;
							_update_class(v.next.$el, margin_right_class, next_margin.current.right);
							v.next.$el.data('margin', next_margin);
							margin_data.current.right = 0;
							update_class = true;
						}
						swapped = true;
						moved = true;
					}
					else if ( avail_top_width >= me.width ){
						var fill_margin = Math.round((avail_top_width-me.width)/margin_increment);
						if ( margin_data.original.left != 0 || margin_data.original.right != fill_margin || margin_data.original.bottom > 0 ){
							margin_data.current.left = 0;
							margin_data.current.right = fill_margin;
							margin_data.current.bottom = 0;
							update_class = true;
						}
						if ( avail_top_width == containment_limit[1]-containment_limit[0] ){
							add_clear = true;
						}
						moved = true;
					}
					if ( moved ){
						/*$preview.css({width:0, height:0}).addClass('upfront-preview-hide');
						me.$el.parent().after('<div class="upfront-preview-transition" style="width:'+v.width+'px;height:'+v.height+'px"></div>');
						$('.upfront-preview-transition').animate({width:0, height:0}, animate_duration, 'linear', function(){ $(this).remove(); });*/
						if ( ! is_prev ){
							v.next.$el.parent().before(me.$el.parent());
							resort = true;
						}
					}
				}
				// Use prev is exists and the direction is right/bottom
				else if ( v.prev && (direction_prev != 0) ){
					// available width and space
					var prev_affected_els = behavior._get_affected_elements(v.prev, elements_pos, [me]),
						prev_move_limit = behavior._get_move_limit(prev_affected_els, containment_limit),
						prev_margin = v.prev.$el.data('margin'),
						current_direction = _get_direction(v.prev.$el, me.center.x, me.position.top+pos_tolerance),
						same_line = ( me.outer_position.top == v.prev.outer_position.top ),
						get_prev = v.prev.$el.parent().prev(),
						is_prev = get_prev ? get_prev.find(">.upfront-editable_entity:first").attr('id') == me.$el.attr('id') : false,
						get_next = v.prev.$el.parent().next(),
						is_next = !is_prev && get_next ? get_next.find(">.upfront-editable_entity:first").attr('id') == me.$el.attr('id') : false;
					console.log([current_direction, direction_prev]);
					//if ( is_next && direction_prev == 1 && same_line ) // Same order and direction, no need to resort/move
					//	return;
					/*if ( _.find(prev_affected_els.right, function(each){ return ( each.$el == me.$el ); }) ){ // Since the right affected elements is current element, add it's position to the move limit
						prev_move_limit[1] = me.outer_position.right;
					}*/
					avail_top_width = containment_limit[1]-prev_move_limit[0];
					avail_width = prev_move_limit[1]-prev_move_limit[0];
					avail_space = avail_width-(v.prev.width);
					avail_space_left = v.prev.position.left-prev_move_limit[0];
					avail_space_right = avail_space-avail_space_left;
					console.log(prev_move_limit);
					
					if ( direction_prev == 1 && avail_space_right >= me.width ) {
						if ( is_next && same_line )
							return;
						var fill_margin = Math.round((avail_space_right-me.width)/margin_increment);
						if ( margin_data.original.left != 0 || margin_data.original.right != fill_margin || prev_margin.original.right != 0 ){
							margin_data.current.left = 0;
							margin_data.current.right = fill_margin;
							update_class = true;
							prev_margin.current.right = 0;
							_update_class(v.prev.$el, margin_right_class, prev_margin.current.right);
							v.prev.$el.data('margin', prev_margin);
						}
						moved = true;
					}
					else if ( direction_prev == 1 && is_prev && same_line ) {
						if ( prev_margin.original.right > 0 ){
							margin_data.current.right = prev_margin.original.right;
							prev_margin.current.right = 0;
							_update_class(v.prev.$el, margin_right_class, prev_margin.current.right);
							v.prev.$el.data('margin', prev_margin);
						}
						swapped = true;
						moved = true;
					}
					else /*if ( avail_top_width >= me.width )*/{
						var prev_line = _.find(v.lines_pos, function(line){
							return _.find(line.elements, function(each){ return each.$el == v.prev.$el; }) ? true : false;
						});
						if ( v.offset.top > prev_line.bottom ){
							var fill_margin = Math.round((containment_limit[1]-containment_limit[0]-me.width)/margin_increment);
							add_clear = true;
						}
						else{
							var fill_margin = Math.round((avail_top_width-me.width)/margin_increment);
							prev_margin.current.bottom = 0;
							_update_class(v.prev.$el, margin_bottom_class, prev_margin.current.bottom);
							v.prev.$el.data('margin', prev_margin);
						}
						if ( margin_data.original.left != 0 || margin_data.original.right != fill_margin || margin_data.original.bottom > 0 ){
							margin_data.current.left = 0;
							margin_data.current.right = fill_margin;
							margin_data.current.bottom = 0;
							update_class = true;
						}
						moved = true;
					}
					if ( moved ){
						/*$preview.css({width:0, height:0}).addClass('upfront-preview-hide');
						me.$el.parent().after('<div class="upfront-preview-transition" style="width:'+v.width+'px;height:'+v.height+'px"></div>');
						$('.upfront-preview-transition').animate({width:0, height:0}, animate_duration, 'linear', function(){ $(this).remove(); });*/
						if ( ! is_next ){
							v.prev.$el.parent().after(me.$el.parent());
							resort = true;
						}
					}
				}
				
				if ( moved ){
					/*setTimeout(function(){*/
						/*$preview.animate({width:v.width, height:v.height}, animate_duration, 'linear', function(){
							$(this).removeClass('upfront-preview-hide');
						});*/
						// Update classes
						/*if ( margin_data.original.top != 0 ){
							margin_data.current.top = 0;
							_update_class($preview, margin_top_class, margin_data.current.top);
							_update_class(me.$el, margin_top_class, margin_data.current.top);
						}*/
						if ( update_class ){
							_update_class($preview, margin_left_class, margin_data.current.left);
							_update_class($preview, margin_right_class, margin_data.current.right);
							_update_class(me.$el, margin_left_class, margin_data.current.left);
							_update_class(me.$el, margin_right_class, margin_data.current.right);
						}
						if ( add_clear ){
							$preview.addClass('clr');
							me.$el.addClass('clr');
						}
						else {
							$preview.removeClass('clr');
							me.$el.removeClass('clr');
						}
						me.$el.data('margin', margin_data);
						// Resort
						if ( resort ){
							view.resort_bound_collection();
						}
						if ( v.affected_els.right.length > 0 && !swapped ){
							_.each(v.affected_els.right, function(each){
								var each_margin = each.$el.data('margin'),
									each_margin_size = Math.round((me.position.right-me.outer_position.left)/margin_increment) + each_margin.original.left;
								each_margin.current.left = each_margin_size;
								each.$el.data('margin', each_margin);
								_update_margin_classes(each.$el);
								if ( me.outer_position.left-2 <= containment_limit[0] )
									each.$el.addClass('clr');
							});
						}
						if ( v.affected_els.left.length > 0 && !swapped ){
							_.each(v.affected_els.left, function(each){
								var each_affected_els = behavior._get_affected_elements(each, elements_pos, [me]),
									each_margin = each.$el.data('margin'),
									fill_margin = Math.round((containment_limit[1]-each.position.right)/margin_increment);
								if ( each_affected_els.right.length > 0 )
									return;
								each_margin.current.right = fill_margin;
								each.$el.data('margin', each_margin);
								_update_margin_classes(each.$el);
							});
						}
						me.$el.show();
						$preview.hide();
						_update_elements_pos(); // Generate list of elements and it's position
						_update_margin_data(); // Generate margin data
						me.$el.hide();
						$preview.show();
					/*}, animate_duration);*/
				}
				console.log('moved:'+moved+', resort:'+resort);
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
					each.$el.find(".upfront-debug-info").text('offset: '+each.position.left+','+each.position.top+','+each.position.right+','+each.position.bottom + '| outer offset: '+each.outer_position.left+','+each.outer_position.top+','+each.outer_position.right+','+each.outer_position.bottom);
				});
				
				$me.hide();
				$el.append('<div class="upfront-preview-helper '+classes+'" style="height:'+height+'px;"></div>');
			},
			drag: function (e, ui) {
				if(model.get_property_value_by_name('disable_drag')===1){
					return false;
				}

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
					lines_pos = [],
					lines_top = _.keys(lines),
					next_line = _.find(lines, function(els, top){
						top = parseInt(top);
						first_top = parseInt(lines_top[0]);
						if ( current_top < top && (top == first_top || (top > first_top && top-current_top <= pos_tolerance)) && top != me_pos.outer_position.top )
							return true;
						return false;
					}),
					current_line = lines[_.find(lines_top, function(line, index, list){
						if ( index < list.length-1 && line <= current_top && list[index+1] > current_top )
							return true;
						if ( (index == 0 && current_top < line) || index == list.length-1 )
							return true;
						return false;
					})],
					use_line = next_line ? next_line : current_line,
					next = _.find(use_line, function(each, index, list){
						if ( each.width < width ){
							if ( current_left < each.position.left && each.position.bottom > current_top )
								return true;
						}
						else if ( each.width >= width ){
							if ( current_right <= each.position.right && each.position.bottom > current_top )
								return true;
						}
						if ( next_line && index == list.length-1 )
							return true;
						return false;
					}),
					next_index = next ? _.indexOf(filtered_elements_pos, next) : false,
					prev = next_index > 0 ? filtered_elements_pos[next_index-1] : ( next_index === 0 ? false : _.last(use_line)),
					prev_index = prev ? _.indexOf(filtered_elements_pos, prev) : false,
					
					// Finding the closest element
					filtered_elements_pos = _.map(filtered_elements_pos, function(each){
						var diff_x = each.center.x - current_x,
							diff_y = each.center.y - current_y;
						each.distance = Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y, 2));
						return each;
					});
					closest = _.min(filtered_elements_pos, function(each){
						return each.distance;
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
					
					// affected_elements will hold elements that is affected by the flow of current element
					affected_elements = behavior._get_affected_elements(me_pos, elements_pos, [], true),
					affected_elements_all = behavior._get_affected_elements(me_pos, elements_pos),
					
					// figure out the bottom affected elements and get the max bottom position
					bottom_closest_el = _.min(affected_elements.bottom, function(each){ return each.position.top; }),
					bottom_el_margin = bottom_closest_el ? bottom_closest_el.$el.data('margin').original.top : 0,
					affected_all_x = _.filter(affected_elements_all.left.concat(affected_elements_all.right), function(each){
						return ( (bottom_closest_el && each.position.bottom <= bottom_closest_el.outer_position.top) || !bottom_closest_el );
					}),
					line_bottom = _.max(affected_all_x, function(each){
						return parseInt(each.position.bottom); 
					}),
					
					// move_limit store the available movement on left/right
					move_limit = behavior._get_move_limit(affected_elements, containment_limit),
					max_margin_x = 0,
					max_margin_y = 0,
					recalc_margin_x = false,
					recalc_margin_y = false,
					
					new_line = false,

					resort = false
				;
			
				
				var tmp_bottom = -1, tmp_index = -1;
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
				});
				
				
				// Calculate margins
				max_margin_x = Math.round((move_limit[1]-move_limit[0]-width)/margin_increment);
				
				margin_size = margin_size > 0 ? (margin_size > max_margin_x ? max_margin_x : margin_size) : 0;
				if ( margin_data.current.left != margin_size ){
					margin_data.current.left = margin_size;
					if ( affected_elements.right.length == 0 ){ // No elements on the right, adjusting margin right
						var margin_right_size = max_margin_x-margin_size;
						margin_data.current.right = margin_right_size > 0 ? margin_right_size : 0;
					}
					$me.data('margin', margin_data);
					$preview.css('left', (margin_data.current.left-margin_data.original.left)*margin_increment);
					recalc_margin_x = true;
				}
				
				max_margin_y = affected_elements.bottom.length > 0 ? Math.round((bottom_closest_el.position.top-me_pos.outer_position.top-me_pos.height)/BASELINE) : -1;
				margin_data.current.top = margin_top_size > 0 ? (max_margin_y > -1 && margin_top_size > max_margin_y ? max_margin_y : margin_top_size) : 0;
				$me.data('margin', margin_data);
				if ( max_margin_y > -1 ){
					$preview.css('top', (margin_data.current.top-margin_data.original.top)*BASELINE);
					recalc_margin_y = true;
				}
				else {
					_update_class($preview, margin_top_class, margin_data.current.top);
				}
				// Recalculate margin bottom
				if ( line_bottom ){
					if ( affected_elements.right.length == 0 ){
						margin_data.current.bottom = line_bottom.position.bottom > current_bottom ? Math.round((line_bottom.position.bottom-current_bottom)/BASELINE) : 0;
					}
					else {
						margin_data.current.bottom = 0;
						var line_right = _.max(affected_elements_all.right, function(each){ return each.outer_position.left; }),
							line_right_margin = line_right.$el.data('margin'),
							bottom_cmp = current_bottom > line_bottom.position.bottom ? current_bottom : line_bottom.position.bottom;
						line_right_margin.current.bottom = bottom_cmp > line_right.position.bottom ? Math.round((bottom_cmp-line_right.position.bottom)/BASELINE) : 0;
						line_right.$el.data('margin', line_right_margin);
					}
					_.each(affected_all_x, function(each){
						var each_margin = each.$el.data('margin');
						if ( line_right && line_right.$el == each.$el )
							return;
						if ( each.position.bottom <= line_bottom.position.bottom ){
							each_margin.current.bottom = 0;
							each.$el.data('margin', each_margin);
						}
					});
				}
				else {
					margin_data.current.bottom = 0;
				}
				
				// Recalculate margin so the affected elements remain in their position
				if ( recalc_margin_x ){
					_.each(affected_elements.right, function(each){
						var each_margin = each.$el.data('margin'),
							each_margin_size = max_margin_x-margin_data.current.left,
							each_margin_relative = (each.position.left > move_limit[1]) ? Math.round((each.position.left-move_limit[1])/margin_increment) : 0;
						if ( each_margin.current.left != each_margin_size+each_margin_relative ){
							each_margin.current.left = each_margin_size+each_margin_relative;
							each.$el.data('margin', each_margin);
						}
					});
				}
				if ( recalc_margin_y ){
					_.each(affected_elements.bottom, function(each){
						var each_margin = each.$el.data('margin'),
							each_margin_size = max_margin_y-margin_data.current.top - (line_bottom && line_bottom.position.bottom > current_bottom ? Math.round((line_bottom.position.bottom-current_bottom)/BASELINE) : 0),
							each_margin_relative = each_margin.original.top-bottom_el_margin;
						if ( each_margin.current.top != each_margin_size+each_margin_relative ){
							each_margin.current.top = each_margin_size+each_margin_relative;
							each.$el.data('margin', each_margin);
						}
					});
				}
				
				// Preview resort
				clearTimeout(_preview_t);
				_preview_t = setTimeout(function(){ _preview_resort(me_pos, {
					prev: prev,
					next: next,
					closest: closest,
					offset: {
						top: current_top,
						left: current_left,
						bottom: current_bottom,
						right: current_right,
						x: current_x,
						y: current_y
					},
					width: width,
					height: height,
					affected_els: affected_elements,
					lines: lines,
					lines_pos: lines_pos
				}); }, _preview_delay);
				
				
				if ( !closest.$el.hasClass('upfront-closest') ){
					$('.upfront-closest').removeClass('upfront-closest');
					closest.$el.addClass('upfront-closest');
				}
				if ( !next || !prev ) {
					$('.upfront-prev, .upfront-next').removeClass('upfront-prev upfront-next');
				}
				if ( (prev && ! prev.$el.hasClass('upfront-prev')) || (next && ! next.$el.hasClass('upfront-next')) ){
					$('.upfront-prev, .upfront-next').removeClass('upfront-prev upfront-next');
					if (prev) prev.$el.addClass('upfront-prev');
					if (next) next.$el.addClass('upfront-next');
				}
				$('.upfront-affected-top, .upfront-affected-bottom, .upfront-affected-left, .upfront-affected-right').removeClass('upfront-affected-top upfront-affected-bottom upfront-affected-left upfront-affected-right');
				_.each(affected_elements, function(els, key){
					_.each(els, function(each){
						if ( !each.$el.hasClass('upfront-affected-'+key) ){
							each.$el.addClass('upfront-affected-'+key);
						}
					})
				});
				
				$el.find(".upfront-debug-info").text('current offset: '+current_left+','+current_top+','+current_right+','+current_bottom+' | x,y: '+current_x+','+current_y+' | relative offset: '+relative_left+','+relative_top+' | margin size: '+margin_data.current.top+'/'+margin_data.current.left+','+margin_data.current.right);
				//return !resort;

			},
			stop: function (e, ui) {
				var 
					$target = view.$el.find(">.upfront-editable_entity:first"),
					margin_data = $target.data('margin')
				;
				
				// Clear preview timeout
				clearTimeout(_preview_t);
				
				view.$el.find('.upfront-preview-helper').remove();
				view.model.replace_class(margin_left_class+margin_data.current.left);
				view.model.replace_class(margin_right_class+margin_data.current.right);
				view.model.replace_class(margin_top_class+margin_data.current.top);
				view.model.replace_class(margin_bottom_class+margin_data.current.bottom);
				
				if ( $target.hasClass('clr') )
					view.model.add_class('clr');
				else
					view.model.remove_class('clr');
				
				// Change affecting elements margin size as well
				view.$el.parent().children().each(function(){
					var $el = $(this).find(">.upfront-editable_entity:first");
					if ( $el.attr('id') == $target.attr('id') )
						return;
					var
						each_margin_data = $el.data('margin'),
					// @TODO Better way to get correct model instead of iterate like this?
						modules = app.layout.get('regions').active_region.get('modules'),
						model = modules.get_by_element_id($el.attr('id'));
					if ( ! model )
						modules.each(function(module){
							var objects = module.get('objects'),
								object_model = objects.get_by_element_id($el.attr('id'));
							if ( object_model )
								model = object_model;
						});
					if ( each_margin_data && each_margin_data.original != each_margin_data.current ){
						model.replace_class(margin_left_class+each_margin_data.current.left);
						model.replace_class(margin_right_class+each_margin_data.current.right);
						model.replace_class(margin_top_class+each_margin_data.current.top);
						model.replace_class(margin_bottom_class+each_margin_data.current.bottom);
					}
					if ( $el.hasClass('clr') )
						model.add_class('clr');
					else
						model.remove_class('clr');
				});
				
				$target.show();
				//console.log(margin_increment)
				//console.log([current_margin_left_size, margin_size]);
				//console.log([relative_left, margin_pfx + margin_size])
				
				//view.resort_bound_collection();
			}
		});
	},
	
	_get_element_position: function (el) {
		var $el = $(el).find(">.upfront-editable_entity:first"),
			top = $el.offset().top,
			left = $el.offset().left,
			outer_top = top-parseFloat($el.css('margin-top')),
			outer_left = left-parseFloat($el.css('margin-left'));
		return {
			$el: $el,
			position: {
				top: top,
				left: left,
				bottom: top+$el.outerHeight(),
				right: left+$el.outerWidth()
			},
			outer_position: {
				top: Math.round(outer_top),
				left: Math.round(outer_left),
				bottom: Math.round(outer_top+$el.outerHeight(true)),
				right: Math.round(outer_left+$el.outerWidth(true))
			},
			width: $el.outerWidth(),
			height: $el.outerHeight(),
			center: {
				y: top+($el.outerHeight()/2),
				x: left+($el.outerWidth()/2)
			}
		};
	},
	
	_generate_elements_position: function (elements) {
		return _.map(elements, Upfront.Behaviors.LayoutEditor._get_element_position);
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
				current_margin_top_size = current_margin_top && current_margin_top.length ? parseInt(current_margin_top[1], 10) : 0,
				
				current_margin_bottom = $el.attr("class").match(margin_bottom_rx),
				current_margin_bottom_size = current_margin_bottom && current_margin_bottom.length ? parseInt(current_margin_bottom[1], 10) : 0
			;
			
			$el.data('margin', {
				original: {
					left: current_margin_left_size,
					right: current_margin_right_size,
					top: current_margin_top_size,
					bottom: current_margin_bottom_size
				},
				current: {
					left: current_margin_left_size,
					right: current_margin_right_size,
					top: current_margin_top_size,
					bottom: current_margin_bottom_size
				}
			});
		});
	},
	
	_get_affected_elements: function (el_pos, els_pos, ignore, direct) {
		var affected_els = {
				top: [],
				left: [],
				bottom: [],
				right: []
			},
			compare = {
				top: el_pos.outer_position.top,
				left: el_pos.outer_position.left,
				bottom: el_pos.outer_position.bottom,
				right: el_pos.outer_position.right
			};
		if ( Array.isArray(ignore) )
			ignore.push(el_pos);
		else
			ignore = [el_pos];
		direct = direct ? true : false;
		_.each(_.reject(els_pos, function(each){
				var ignored = _.find(ignore, function(i){
					return i.$el.attr('id') == each.$el.attr('id');
				});
				return ignored ? true : false;
			}), 
			function(each){
				if ( (compare.bottom > each.outer_position.top &&
					compare.bottom <= each.outer_position.bottom) ||
					(compare.top >= each.outer_position.top &&
					compare.top < each.outer_position.bottom) ){
					if ( compare.left+2 >= each.outer_position.right &&
						(!direct || compare.left-each.outer_position.right <= 3) ){
						affected_els.left.push(each);
					}
					if ( compare.right-2 <= each.outer_position.left &&
						(!direct || each.outer_position.left-compare.right <= 3) ){
						affected_els.right.push(each);
					}
				}
				if ( compare.top+2 >= each.outer_position.bottom ){
					affected_els.top.push(each);
				}
				if ( compare.bottom-2 <= each.outer_position.top ){
					affected_els.bottom.push(each);
				}
			}
		);
		if ( direct ){
			var direct_top = _.max(affected_els.top, function(each){ return each.outer_position.top; });
			affected_els.top = _.filter(affected_els.top, function(each){
				return ( each.outer_position.top == direct_top.outer_position.top );
			});
			var direct_bottom = _.min(affected_els.bottom, function(each){ return each.outer_position.top; });
			affected_els.bottom = _.filter(affected_els.bottom, function(each){
				return ( each.outer_position.top == direct_bottom.outer_position.top );
			});
		}
		return affected_els;
	},
	
	_get_move_limit: function (affected_els, containment_limit) {
		var move_limit = [containment_limit[0], containment_limit[1]];
		_.each(affected_els.left, function(each){
			if ( each.position.right > move_limit[0] )
				move_limit[0] = each.position.right;
		});
		_.each(affected_els.right, function(each){
			if ( each.position.left < move_limit[1] )
				move_limit[1] = each.position.left;
		});
		return move_limit;
	},

	create_undo: function () {
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