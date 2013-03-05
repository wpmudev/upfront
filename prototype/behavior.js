jQuery(document).ready(function($){
	
	var
		$main = $('#page'),
		main_pos = $main.offset(),
		main_limit = [main_pos.left, main_pos.left+$main.outerWidth()],
		$containment = $('.upfront-region'),
		containment_pos = $containment.offset(),
		containment_limit = [containment_pos.left, containment_pos.left+$containment.outerWidth()],
		width_class = 'c',
		margin_left_class = 'ml',
		margin_right_class = 'mr',
		margin_top_class = 'mt',
		margin_bottom_class = 'mb',
		tmp = $containment.append("<div id='upfront-temp-measurement' class='" + margin_left_class + "1 " + width_class + "1' />"),
		$measure = $("#upfront-temp-measurement"),
		margin_increment = parseFloat($("#upfront-temp-measurement").css("margin-left"), 10),
		width_rx = new RegExp('\\b' + width_class + '\\d+'),
		margin_left_rx = new RegExp('\\b' + margin_left_class + '\\d+'),
		margin_right_rx = new RegExp('\\b' + margin_right_class + '\\d+'),
		margin_top_rx = new RegExp('\\b' + margin_top_class + '\\d+'),
		margin_bottom_rx = new RegExp('\\b' + margin_bottom_class + '\\d+'),
		GRID_SIZE = 22,
		BASELINE = 15,
		
		// Keep tracking of variables
		elements_pos = [],
		wrappers_pos = [],
		pos_tolerance = 50,
		
		_get_element_position = function (el) {
			var $el = $(el),
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
					y: Math.round(top+($el.outerHeight()/2)),
					x: Math.round(left+($el.outerWidth()/2))
				}
			};
		},
		
		_generate_elements_position = function (elements) {
			return _.map(elements, _get_element_position);
		},
		
		_generate_elements_margin_data = function (elements) {
			_.each(elements, function(each){
				var $el = $(each),
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
		
		_get_affected_elements = function (el_pos, els_pos, ignore, direct) {
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
						return i.$el == each.$el;
					});
					return ignored ? true : false;
				}), 
				function(each){
					if ( (compare.bottom > each.outer_position.top &&
						compare.bottom <= each.outer_position.bottom) ||
						(compare.top >= each.outer_position.top &&
						compare.top < each.outer_position.bottom) ||
						(each.outer_position.bottom > compare.top &&
						each.outer_position.top <= compare.bottom) ||
						(each.outer_position.top >= compare.top &&
						each.outer_position.top < compare.bottom) ){
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
		
		_get_move_limit = function (affected_els, containment_limit) {
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
			elements_pos = _generate_elements_position($('.upfront-module'));
		},
		_update_wrappers_pos = function () {
			wrappers_pos = _generate_elements_position($('.upfront-wrapper'));
		},
		_update_margin_data = function () {
			_generate_elements_margin_data($('.upfront-module'));
		},
		_update_wrappers = function(){
			$('.upfront-wrapper').each(function(){
				if ( $(this).children().size() == 0 ){
					$(this).remove();
					return;
				}
				if ( $(this).hasClass('upfront-wrapper-preview') )
					return;
				var child_pos = _generate_elements_position($(this).children()),
					max_left = _.min(child_pos, function(each){ return each.outer_position.left; }),
					max_right = _.max(child_pos, function(each){ return each.outer_position.right; }),
					wrap_w = Math.round((max_right.outer_position.right-max_left.outer_position.left)/margin_increment);
				_update_class($(this), width_class, wrap_w);
			});
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
	
	$('.upfront-module').draggable({
		revert: true,
		revertDuration: 1,
		zIndex: 100,
		helper: 'clone',
		appendTo: $main,
		start: function (e, ui) {
			var 
				$me = $(this),
				height = $me.outerHeight(),
				width = $me.outerWidth(),
				classes = $me.attr('class')
			;
			
			
			_update_elements_pos(); // Generate list of elements and it's position
			_update_margin_data(); // Generate margin data
			_update_wrappers_pos();
			
			// debug info
			_.each(elements_pos, function(each){
				each.$el.find(".upfront-debug-info").text('offset: '+each.position.left+','+each.position.top+','+each.position.right+','+each.position.bottom + '| outer offset: '+each.outer_position.left+','+each.outer_position.top+','+each.outer_position.right+','+each.outer_position.bottom);
			});
			
			$me.css('visibility', 'hidden');
			//$me.hide();
			//$el.append('<div class="upfront-preview-helper '+classes+'" style="height:'+height+'px;"></div>');
		},
		drag: function (e, ui) {
			// Set up collection position
			var 
				$me = $(this),
				$helper = $('.ui-draggable-dragging'),
				wrap = $me.closest('.upfront-wrapper').get(0),
				
				height = $helper.outerHeight(),
				width = $helper.outerWidth(),

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
				lines = _.groupBy(elements_pos, function(each){ return each.outer_position.top; }),
				lines_pos = [],
				lines_top = _.keys(lines),
				me_wrap = _.find(wrappers_pos, function(each){
					return ( wrap == each.$el.get(0) );
				}),
				/*current_line = lines[_.find(lines_top, function(line, index, list){
					if ( index < list.length-1 && line <= current_top && list[index+1] > current_top )
						return true;
					if ( (index == 0 && current_top < line) || index == list.length-1 )
						return true;
					return false;
				})],
				next_line = _.find(lines, function(els, top){
					top = parseInt(top);
					first_top = parseInt(lines_top[0]);
					current_line_max = _.max(current_line, function(each){ return each.position.bottom <= top ? each.position.bottom : 0; });
					if ( current_top < top && (top == first_top || (top > first_top && e.pageY > current_line_max.position.bottom)) && top != me_pos.outer_position.top )
						return true;
					return false;
				}),
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
				next_index = next ? _.indexOf(elements_pos, next) : false,
				prev = next ? false : _.last(use_line),
				prev_index = prev ? _.indexOf(elements_pos, prev) : false,
				
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
				closest_prev = closest_index > 0 ? filtered_elements_pos[closest_index-1] : false,*/
				
				// Figure out the margin
				margin_data = $me.data('margin'),
				
				relative_left = me_pos.position.left - current_left,
				relative_top = me_pos.position.top - current_top,
				
				relative_margin_size = -1 * (relative_left ? Math.round(relative_left / margin_increment) : 0),
				margin_size = margin_data.original.left + relative_margin_size,
				relative_margin_top_size = -1 * (relative_top ? Math.round(relative_top / BASELINE) : 0),
				margin_top_size = margin_data.original.top + relative_margin_top_size,
				
				// affected_elements will hold elements that is affected by the flow of current element
				affected_elements = _get_affected_elements(me_wrap, elements_pos, [], true),
				affected_elements_all = _get_affected_elements(me_wrap, elements_pos),
				
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
				move_limit = _get_move_limit(affected_elements, containment_limit),
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
			
			// Closest wrapper
			/*var closest_wrap_top, closest_wrap_bottom, closest_wrap_left, closest_wrap_right, use_wrap, wrap_affected, wrap_move_limit;
			_.each(wrappers_pos, function(each){
				var diff_x = each.center.x - current_x,
					diff_x1 = each.position.left - current_x,
					diff_x2 = each.position.right - current_x,
					diff_y = each.center.y - e.pageY,
					diff_y1 = each.position.top - e.pageY,
					diff_y2 = each.position.bottom - e.pageY,
					distance1 = Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y1, 2)),
					distance2 = Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y2, 2)),
					distance3 = Math.sqrt(Math.pow(diff_x1, 2) + Math.pow(diff_y, 2)),
					distance4 = Math.sqrt(Math.pow(diff_x2, 2) + Math.pow(diff_y, 2));
				if ( (closest_wrap_bottom && closest_wrap_bottom.$el.data('distance-bottom') > distance1) || !closest_wrap_bottom ){
					closest_wrap_bottom = each;
				}
				if ( (closest_wrap_top && closest_wrap_top.$el.data('distance-top') > distance2) || !closest_wrap_top ){
					closest_wrap_top = each;
				}
				if ( (closest_wrap_right && closest_wrap_right.$el.data('distance-right') > distance3) || !closest_wrap_right ){
					closest_wrap_right = each;
				}
				if ( (closest_wrap_left && closest_wrap_left.$el.data('distance-left') > distance4) || !closest_wrap_left ){
					closest_wrap_left = each;
				}
				each.$el.data('distance-bottom', distance1);
				each.$el.data('distance-top', distance2);
				each.$el.data('distance-right', distance3);
				each.$el.data('distance-left', distance4);
			});
			
			if ( closest_wrap_top.$el == closest_wrap_bottom.$el ){
				use_wrap = closest_wrap_top;
			}
			else {
				if ( closest_wrap_top.position.bottom >= e.pageY )
					use_wrap = closest_wrap_top;
				else
					use_wrap = closest_wrap_bottom;
			}
			console.log(e.pageY);
			wrap_affected = _get_affected_elements(use_wrap, elements_pos, [], true);
			wrap_move_limit = _get_move_limit(wrap_affected, containment_limit);
			if ( wrap_move_limit[1]-wrap_move_limit[0] < width-2 )
				use_wrap = false;
			console.log(wrap_move_limit);
			console.log(use_wrap);
			
			if ( !closest_wrap_top.$el.hasClass('upfront-closest-wrapper-top') ){
				$('.upfront-closest-wrapper-top').removeClass('upfront-closest-wrapper-top');
				closest_wrap_top.$el.addClass('upfront-closest-wrapper-top');
			}
			if ( !closest_wrap_bottom.$el.hasClass('upfront-closest-wrapper-bottom') ){
				$('.upfront-closest-wrapper-bottom').removeClass('upfront-closest-wrapper-bottom');
				closest_wrap_bottom.$el.addClass('upfront-closest-wrapper-bottom');
			}
			if ( !closest_wrap_left.$el.hasClass('upfront-closest-wrapper-left') ){
				$('.upfront-closest-wrapper-left').removeClass('upfront-closest-wrapper-left');
				closest_wrap_left.$el.addClass('upfront-closest-wrapper-left');
			}
			if ( !closest_wrap_right.$el.hasClass('upfront-closest-wrapper-right') ){
				$('.upfront-closest-wrapper-right').removeClass('upfront-closest-wrapper-right');
				closest_wrap_right.$el.addClass('upfront-closest-wrapper-right');
			}
			if ( use_wrap && !use_wrap.$el.hasClass('upfront-closest-wrapper-use') ){
				$('.upfront-closest-wrapper-use').removeClass('upfront-closest-wrapper-use');
				use_wrap.$el.addClass('upfront-closest-wrapper-use');
			}
			else if ( !use_wrap ) {
				$('.upfront-closest-wrapper-use').removeClass('upfront-closest-wrapper-use');
			}*/
			
			var next = _.find(elements_pos, function(each, index){
					if ( e.pageX > each.position.right || e.pageY > each.position.bottom )
						return false;
					if ( current_top < each.center.y && e.pageX >= each.position.left )
						return true;
					if ( e.pageX < each.position.left && e.pageY <= each.position.bottom )
						return true;
				}),
				reverse_pos = _.sortBy(elements_pos, function(each, index, list){
					return list.length - index;
				}),
				prev = _.find(reverse_pos, function(each){
					if ( current_bottom < each.position.top )
						return false;
					if ( e.pageX > each.position.left && e.pageY >= each.outer_position.top )
						return true;
					return false;
				}),
				last = _.last(elements_pos),
				next_dir = next ? _get_direction(next.$el, e.pageX, e.pageY) : -1,
				prev_dir = prev ? _get_direction(prev.$el, e.pageX, e.pageY) : -1,
				
				$shadow = $('#upfront-tmp-preview').size() > 0 ? $('#upfront-tmp-preview') : $('<div id="upfront-tmp-preview" class="upfront-shadow"></div>'),
				moved = false;
			
			if ( (next && next.$el == me_pos.$el) || (prev && prev.$el == me_pos.$el) ){
				// Not moving so calculate margin
			
				// Calculate margins
				max_margin_x = Math.round((move_limit[1]-move_limit[0]-width)/margin_increment);
				
				margin_size = margin_size > 0 ? (margin_size > max_margin_x ? max_margin_x : margin_size) : 0;
				if ( margin_data.current.left != margin_size ){
					margin_data.current.left = margin_size;
					/*if ( affected_elements.right.length == 0 ){ // No elements on the right, adjusting margin right
						var margin_right_size = max_margin_x-margin_size;
						margin_data.current.right = margin_right_size > 0 ? margin_right_size : 0;
					}*/
					$me.data('margin', margin_data);
					//$preview.css('left', (margin_data.current.left-margin_data.original.left)*margin_increment);
					recalc_margin_x = true;
				}
				
				max_margin_y = affected_elements.bottom.length > 0 ? Math.round((bottom_closest_el.position.top-me_pos.outer_position.top-me_pos.height)/BASELINE) : -1;
				margin_data.current.top = margin_top_size > 0 ? (max_margin_y > -1 && margin_top_size > max_margin_y ? max_margin_y : margin_top_size) : 0;
				$me.data('margin', margin_data);
				if ( max_margin_y > -1 ){
					//$preview.css('top', (margin_data.current.top-margin_data.original.top)*BASELINE);
					recalc_margin_y = true;
				}
				else {
					//_update_class($preview, margin_top_class, margin_data.current.top);
				}
				// Recalculate margin bottom
				/*if ( line_bottom ){
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
				}*/
				
				// Recalculate margin so the affected elements remain in their position
				if ( recalc_margin_x ){
					var wrap_els = _.filter(filtered_elements_pos, function(each){
							return wrap == each.$el.closest('.upfront-wrapper').get(0);
						}),
						wrap_max_x = _.max(wrap_els, function(each){
							return each.position.right;
						}),
						wrap_rel = wrap_max_x && wrap_max_x.position.right > current_right ? Math.round((wrap_max_x.position.right-current_right)/margin_increment) : 0;
					_.each(affected_elements.right, function(each){
						var each_margin = each.$el.data('margin'),
							each_margin_size = max_margin_x - margin_data.current.left - wrap_rel,
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
				if ( parseInt($shadow.css('height')) == height ){
					$shadow.stop().animate({height:0}, 500, function(){ $(this).remove(); });
					//$shadow.css({height:0});
				}
				if ( parseInt($me.css('height')) == 0 ){
					$me.stop().animate({height:height}, 500);
					//$me.css({height:height});
				}
				if ( $me.closest('.upfront-wrapper').css('display') == 'none' )
					$me.closest('.upfront-wrapper').show();
			}
			else {
				// Moving to somewhere else...
				var wrap_cls = width_class+Math.round(width/margin_increment);
				if ( next && next_dir == 0 && next.$el.prev().get(0) != $me.get(0) ){
					var next_wrap = next.$el.closest('.upfront-wrapper').get(0),
						next_wrap_pos = _.find(wrappers_pos, function(each){ return next_wrap == each.$el.get(0); });
					if ( next_wrap_pos.width >= me_pos.width ){
						if ( next.$el.prev().get(0) != $shadow.get(0) ){
							next.$el.before($shadow);
							moved = true;
						}
					}
					else if ( !next_wrap_pos.$el.prev() || next_wrap_pos.$el.prev().find('#upfront-tmp-preview').size() == 0 ){
						next_wrap_pos.$el.before($shadow);
						$shadow.wrap('<div class="upfront-wrapper upfront-wrapper-preview '+wrap_cls+'" />');
						moved = true;
					}
					if ( moved ){
						$shadow.css({width:width, height:0});
						$shadow.stop().animate({height: height}, 500);
						//$shadow.css({height: height});
					}
				}
				else if ( prev && prev_dir == 2 && prev.$el.next().get(0) != $me.get(0) ){
					var prev_wrap = prev.$el.closest('.upfront-wrapper').get(0),
						prev_wrap_pos = _.find(wrappers_pos, function(each){ return prev_wrap == each.$el.get(0); });
					if ( prev_wrap_pos.width >= me_pos.width ){
						if ( prev.$el.next().get(0) != $shadow.get(0) ){
							prev.$el.after($shadow);
							moved = true;
						}
					}
					else if ( !prev_wrap_pos.$el.next() || prev_wrap_pos.$el.next().find('#upfront-tmp-preview').size() == 0 ){
						prev_wrap_pos.$el.after($shadow);
						$shadow.wrap('<div class="upfront-wrapper upfront-wrapper-preview '+wrap_cls+'" />');
						moved = true;
					}
					if ( moved ){
						$shadow.css({width:width, height:height});
						$me.stop().animate({height: 0}, 500);
						//$me.css({height: 0});
					}
				}
				/*else if ( prev && prev_dir == 1 && prev.$el.next().get(0) != $me.get(0) ){
					var prev_wrap = next.$el.closest('.upfront-wrapper').get(0),
						prev_wrap_pos = _.find(wrappers_pos, function(each){ return prev_wrap == each.$el.get(0); }),
						prev_;
					if ( !prev_wrap_pos.$el.next() || prev_wrap_pos.$el.next().find('#upfront-tmp-preview').size() == 0 ){
						prev_wrap_pos.$el.after($shadow);
						$shadow.wrap('<div class="upfront-wrapper upfront-wrapper-preview '+wrap_cls+'" />');
						moved = true;
					}
					if ( moved ){
						$shadow.css({width:width, height:height});
						//$me.closest('.upfront-wrapper').hide();
					}
				}
				else if ( next && next_dir == 3 && next.$el.prev().get(0) != $me.get(0) ){
					var next_wrap = next.$el.closest('.upfront-wrapper').get(0),
						next_wrap_pos = _.find(wrappers_pos, function(each){ return next_wrap == each.$el.get(0); }),
						next_;
					if ( !next_wrap_pos.$el.prev() || next_wrap_pos.$el.prev().find('#upfront-tmp-preview').size() == 0 ){
						next_wrap_pos.$el.before($shadow);
						$shadow.wrap('<div class="upfront-wrapper upfront-wrapper-preview '+wrap_cls+'" />');
						moved = true;
					}
					if ( moved ){
						$shadow.css({width:width, height:height});
						//$shadow.closest('.upfront-wrapper').css({width: 0}).stop().animate({width: width}, 500);
						//$me.closest('.upfront-wrapper').hide();
					}
				}*/
				if ( moved ){
					margin_data.current.left = 0;
					margin_data.current.right = 0;
					margin_data.current.top = 1;
					margin_data.current.bottom = 1;
					$me.data('margin', margin_data);
					//_update_wrappers();
				}
			}
			
			
			// Preview resort
			/*clearTimeout(_preview_t);
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
			}); }, _preview_delay);*/
			
			
			/*if ( !closest.$el.hasClass('upfront-closest') ){
				$('.upfront-closest').removeClass('upfront-closest');
				closest.$el.addClass('upfront-closest');
			}*/
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
			
			$helper.find(".upfront-debug-info").text('current offset: '+current_left+','+current_top+','+current_right+','+current_bottom+' | x,y: '+current_x+','+current_y+' | relative offset: '+relative_left+','+relative_top+' | margin size: '+margin_data.current.top+'/'+margin_data.current.left+','+margin_data.current.right);
			//return !resort;

		},
		stop: function (e, ui) {
			var 
				$target = $(this),
				$shadow = $('#upfront-tmp-preview'),
				margin_data = $target.data('margin')
			;
			
			$target.css({width:'', height:''});
			$target.closest('.upfront-wrapper').show();
			if ( $shadow.size() > 0 ){
				$shadow.before($target);
				$shadow.closest('.upfront-wrapper-preview').removeClass('upfront-wrapper-preview').css({width:'', height:''});
				$shadow.remove();
			}
			
			_update_class($target, margin_left_class, margin_data.current.left);
			_update_class($target, margin_right_class, margin_data.current.right);
			_update_class($target, margin_top_class, margin_data.current.top);
			//_update_class($target, margin_bottom_class, margin_data.current.bottom);
			
			// Clear preview timeout
			//clearTimeout(_preview_t);
			
			/*view.$el.find('.upfront-preview-helper').remove();
			view.model.replace_class(margin_left_class+margin_data.current.left);
			view.model.replace_class(margin_right_class+margin_data.current.right);
			view.model.replace_class(margin_top_class+margin_data.current.top);
			view.model.replace_class(margin_bottom_class+margin_data.current.bottom);
			
			if ( $target.hasClass('clr') )
				view.model.add_class('clr');
			else
				view.model.remove_class('clr');*/
			
			// Change affecting elements margin size as well
			$('.upfront-module').each(function(){
				var $el = $(this);
				if ( $el == $target )
					return;
				var
					each_margin_data = $el.data('margin');
				// @TODO Better way to get correct model instead of iterate like this?
				/*	modules = app.layout.get('regions').active_region.get('modules'),
					model = modules.get_by_element_id($el.attr('id'));
				if ( ! model )
					modules.each(function(module){
						var objects = module.get('objects'),
							object_model = objects.get_by_element_id($el.attr('id'));
						if ( object_model )
							model = object_model;
					});*/
				if ( each_margin_data && each_margin_data.original != each_margin_data.current ){
					/*model.replace_class(margin_left_class+each_margin_data.current.left);
					model.replace_class(margin_right_class+each_margin_data.current.right);
					model.replace_class(margin_top_class+each_margin_data.current.top);
					model.replace_class(margin_bottom_class+each_margin_data.current.bottom);*/
			
					_update_class($el, margin_left_class, each_margin_data.current.left);
					_update_class($el, margin_right_class, each_margin_data.current.right);
					//_update_class($el, margin_top_class, each_margin_data.current.top);
					//_update_class($el, margin_bottom_class, each_margin_data.current.bottom);
				}
				/*
				if ( $el.hasClass('clr') )
					model.add_class('clr');
				else
					model.remove_class('clr');*/
			});
			_update_wrappers();
			
			$target.css('visibility', 'visible');
			//$target.show();
			//console.log(margin_increment)
			//console.log([current_margin_left_size, margin_size]);
			//console.log([relative_left, margin_pfx + margin_size])
			
			//view.resort_bound_collection();
		}
	});
	
});

function _toggle_grid(){
	jQuery('.upfront-overlay-grid').toggle();
}

var _wrapper_bg = true;
function _toggle_wrapper_bg(){
	var $wrapper = jQuery('.upfront-wrapper');
	if ( ! _wrapper_bg ){
		$wrapper.css({background: '', outline: ''});
		_wrapper_bg = true;
	}
	else {
		$wrapper.css({background: 'none', outline: 'none'});
		_wrapper_bg = false;
	}
}
