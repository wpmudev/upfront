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

	create_undo: function () {
		this.layout.store_undo_state();
	},
	apply_history_change: function () {
		this.layout_view.render();
	},

	save_dialog: function (on_complete, context) {
		$("body").append("<div id='upfront-save-dialog-background' />");
		$("body").append("<div id='upfront-save-dialog' />");
		var $dialog = $("#upfront-save-dialog"),
			$bg = $("#upfront-save-dialog-background"),
			current = Upfront.Application.LayoutEditor.layout.get("current_layout"),
			html = ''
		;
		$bg
			.width($(window).width())
			.height($(document).height())
		;
		$.each(_upfront_post_data.layout, function (idx, el) {
			var checked = el == current ? "checked='checked'" : '';
			html += '<input type="radio" name="upfront_save_as" id="' + el + '" value="' + el + '" ' + checked + ' />';
			html += '&nbsp;<label for="' + el + '">' + Upfront.Settings.LayoutEditor.Specificity[idx] + '</label><br />';
		});
		html += '<button type="button" id="upfront-save_as">Save</button>';
		html += '<button type="button" id="upfront-cancel_save">Cancel</button>';
		$dialog
			.html(html)
		;
		$("#upfront-save-dialog").on("click", "#upfront-save_as", function () {
			var $check = $dialog.find(":radio:checked"),
				selected = $check.length ? $check.val() : false
			;
			$bg.remove(); $dialog.remove();
			on_complete.apply(context, [selected]);
			return false;
		});
		$("#upfront-save-dialog").on("click", "#upfront-cancel_save", function () {
			$bg.remove(); $dialog.remove();
			return false;
		});
	}
};


var GridEditor = {
	
	main: {$el: null, top: 0, left: 0, right: 0},
	grid_layout: {top: 0, left: 0, right: 0},
	containment: {$el: null, top: 0, left: 0, right: 0, col: 0, grid: {top: 0, left: 0, right: 0}},
	max_row: 0,
	col_size: 0,
	baseline: 0,
	grid: null,
	
	els: [],
	wraps: [],
	regions: [],
	drops: [],
	
	/**
	 * Get grid position of an x,y offset
	 * 
	 * @param {Int} x
	 * @param {Int} y
	 */
	get_grid: function(x, y){		
		var	ed = Upfront.Behaviors.GridEditor,
			/*grid_x = Math.round((x-ed.containment.left)/ed.col_size)+1,
			grid_y = Math.round((y-ed.containment.top)/ed.baseline)+1;*/
			grid_x = Math.round((x-ed.grid_layout.left)/ed.col_size)+1,
			grid_y = Math.round((y-ed.grid_layout.top)/ed.baseline)+1;
		return {x: grid_x, y: grid_y};
	},
	
	/**
	 * Get position of an element
	 * 
	 * @param {DOM Object} el
	 */
	get_position: function(el){
		var ed = Upfront.Behaviors.GridEditor,
			$el = $(el),
			top = $el.offset().top,
			left = $el.offset().left,
			outer_top = top-parseFloat($el.css('margin-top')),
			outer_left = left-parseFloat($el.css('margin-left')),
			grid = ed.get_grid(left, top),
			outer_grid = ed.get_grid(outer_left, outer_top),
			col = Math.round($el.outerWidth()/ed.col_size),
			outer_col = Math.round($el.outerWidth(true)/ed.col_size),
			row = Math.round($el.outerHeight()/ed.baseline),
			outer_row = Math.round($el.outerHeight(true)/ed.baseline),
			$region = $el.closest('.upfront-region'),
			region = $region.data('name');
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
			},
			col: col,
			row: row,
			grid: {
				top: grid.y,
				left: grid.x,
				right: grid.x+col-1,
				bottom: grid.y+row-1
			},
			outer_grid: {
				top: outer_grid.y,
				left: outer_grid.x,
				right: outer_grid.x+outer_col-1,
				bottom: outer_grid.y+outer_row-1
			},
			grid_center: {
				y: grid.y+(row/2)-1,
				x: grid.x+(col/2)-1
			},
			region: region
		};
	},
	
	/**
	 * Get margin from class name and store in data to use later
	 * 
	 * @param {DOM Object} el
	 */
	init_margin: function (el){
		var ed = Upfront.Behaviors.GridEditor,
			$el = $(el),
			left = ed.get_class_num($el, ed.grid.left_margin_class),
			right = ed.get_class_num($el, ed.grid.right_margin_class),
			top = ed.get_class_num($el, ed.grid.top_margin_class),
			bottom = ed.get_class_num($el, ed.grid.bottom_margin_class)
		;
		$el.data('margin', {
			original: {
				left: left,
				right: right,
				top: top,
				bottom: bottom
			},
			current: {
				left: left,
				right: right,
				top: top,
				bottom: bottom
			}
		});
	},
	
	get_affected_els: function (el, els, ignore, direct) {
		var aff_els = { top: [], left: [], bottom: [], right: [] },
			compare = el.outer_grid;
		if ( Array.isArray(ignore) )
			ignore.push(el);
		else
			ignore = [el];
		direct = direct ? true : false;
		_.each(_.reject(els, function(each){
				var ignored = _.find(ignore, function(i){
					return i.$el.get(0) == each.$el.get(0);
				});
				return ignored ? true : false;
			}), 
			function(each){
				if ( el.region != each.region )
					return;
				if ( ( each.outer_grid.top >= compare.top && each.outer_grid.top < compare.bottom ) ||
					 ( each.outer_grid.bottom >= compare.top && each.outer_grid.bottom <= compare.bottom ) ||
					 ( compare.top >= each.outer_grid.top && compare.top < each.outer_grid.bottom ) || 
					 ( compare.bottom >= each.outer_grid.top && compare.bottom <= each.outer_grid.bottom ) ){
					if ( compare.left > each.outer_grid.right ){
						aff_els.left.push(each);
					}
					if ( compare.right < each.outer_grid.left ){
						aff_els.right.push(each);
					}
				}
				if ( compare.top > each.outer_grid.bottom ){
					aff_els.top.push(each);
				}
				if ( compare.bottom < each.outer_grid.top ){
					aff_els.bottom.push(each);
				}
			}
		);
		if ( direct ){
			var direct_left = _.max(aff_els.left, function(each){ return each.outer_grid.right; });
			aff_els.left = _.filter(aff_els.left, function(each){
				return ( each.outer_grid.right == direct_left.outer_grid.right );
			});
			var direct_right = _.min(aff_els.right, function(each){ return each.outer_grid.left; });
			aff_els.right = _.filter(aff_els.right, function(each){
				return ( each.outer_grid.left == direct_right.outer_grid.left );
			});
			var direct_top = _.max(aff_els.top, function(each){ return each.outer_grid.top; });
			aff_els.top = _.filter(aff_els.top, function(each){
				return ( each.outer_grid.top == direct_top.outer_grid.top );
			});
			var direct_bottom = _.min(aff_els.bottom, function(each){ return each.outer_grid.top; });
			aff_els.bottom = _.filter(aff_els.bottom, function(each){
				return ( each.outer_grid.top == direct_bottom.outer_grid.top );
			});
		}
		return aff_els;
	},
		
	get_affected_wrapper_els: function(el, els, ignore, direct){
		var ed = Upfront.Behaviors.GridEditor,
			aff = ed.get_affected_els(el, els, ignore, direct),
			aff_els = {
				top: _.flatten(_.map(aff.top, function(w){
					var els = _.reject(ed.get_wrap_els(w), function(el){ 
							return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false; 
						}),
						max = ed.get_wrap_el_max(w, ignore, true);
					return _.filter(els, function(el){ return el.outer_grid.bottom == max.outer_grid.bottom; });
				})),
				bottom: _.flatten(_.map(aff.bottom, function(w){
					var els = _.reject(ed.get_wrap_els(w), function(el){ 
							return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false; 
						}),
						min = ed.get_wrap_el_min(w, ignore, true);
					return _.filter(els, function(el){ return el.outer_grid.top == min.outer_grid.top; });
				})),
				left: _.flatten(_.map(aff.left, function(w){
					var els = _.reject(ed.get_wrap_els(w), function(el){ 
							return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false; 
						}),
						max = ed.get_wrap_el_max(w, ignore, false);
					return _.filter(els, function(el){ return el.outer_grid.right == max.outer_grid.right; });
				})),
				right: _.flatten(_.map(aff.right, function(w){
					var els = _.reject(ed.get_wrap_els(w), function(el){ 
							return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false; 
						}),
						min = ed.get_wrap_el_min(w, ignore, false);
					return _.filter(els, function(el){ return el.outer_grid.left == min.outer_grid.left; });
				}))
			};
		return aff_els;
	},
		
	get_move_limit: function (aff_els, containment) {
		var move_limit = [containment.grid.left, containment.grid.right];
		_.each(aff_els.left, function(each){
			if ( each.grid.right > move_limit[0] )
				move_limit[0] = each.grid.right+1;
		});
		_.each(aff_els.right, function(each){
			if ( each.grid.left < move_limit[1] )
				move_limit[1] = each.grid.left-1;
		});
		return move_limit;
	},
	
	
	get_wrap_els: function( use_wrap ){
		var ed = Upfront.Behaviors.GridEditor;
		return _.filter(ed.els, function(each){
			return use_wrap.$el.get(0) == each.$el.closest('.upfront-wrapper').get(0);
		});
	},
	
	get_wrap_el_min: function( use_wrap, ignore, top ){
		var ed = Upfront.Behaviors.GridEditor,
			wrap_els = ed.get_wrap_els(use_wrap),
			wrap_el_min = _.min(_.reject(wrap_els, function(el){
				return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false;
			}), function(each){
				return top ? each.grid.top : each.grid.left;
			});
		return _.isObject(wrap_el_min) ? wrap_el_min : false;
	},
	
	get_wrap_el_max: function( use_wrap, ignore, bottom ){
		var ed = Upfront.Behaviors.GridEditor,
			wrap_els = ed.get_wrap_els(use_wrap),
			wrap_el_max = _.max(_.reject(wrap_els, function(el){
				return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false;
			}), function(each){
				return bottom ? each.grid.bottom : each.grid.right;
			});
		return _.isObject(wrap_el_max) ? wrap_el_max : false;
	},
	
	/**
	 * Get element position data
	 * 
	 * @param {jQuery Object} $el 
	 */
	get_el: function ($el){
		var ed = Upfront.Behaviors.GridEditor;
		return _.find(ed.els, function(each){ return ( $el.get(0) == each.$el.get(0) ); })
	},
	
	/**
	 * Get wrapper position data
	 * 
	 * @param {jQuery Object} $wrap 
	 */
	get_wrap: function ($wrap){
		var ed = Upfront.Behaviors.GridEditor;
		return _.find(ed.wraps, function(each){ return ( $wrap.get(0) == each.$el.get(0) ); })
	},
	
	/**
	 * Get region position data
	 * 
	 * @param {jQuery Object} $region 
	 */
	get_region: function ($region){
		var ed = Upfront.Behaviors.GridEditor;
		return _.find(ed.regions, function(each){ return ( $region.get(0) == each.$el.get(0) ); })
	},
	
	/**
	 * Get drop data
	 * 
	 * @param {jQuery Object} $region 
	 */
	get_drop: function ($drop){
		var ed = Upfront.Behaviors.GridEditor;
		return _.find(ed.drops, function(each){ return ( $drop.get(0) == each.$el.get(0) ); })
	},
	
	/**
	 * Get integer value from class name
	 * 
	 * @param {jQuery Object} $el
	 * @param {String} class_name
	 */
	get_class_num: function ($el, class_name){
		var rx = new RegExp('\\b' + class_name + '(\\d+)')
			val = $el.attr('class').match(rx);
		return ( val && val[1] ) ? parseInt(val[1]) : 0;
	},
	
	/**
	 * Update class name with new value
	 * 
	 * @param {jQuery Object} $el
	 * @param {String} class_name
	 * @param {Int} class_size
	 */
	update_class: function ($el, class_name, class_size) {
		var rx = new RegExp('\\b' + class_name + '\\d+');
		if ( ! $el.hasClass(class_name+class_size) ){
			if ( $el.attr('class').match(rx) )
				$el.attr('class', $el.attr('class').replace(rx, class_name+class_size));
			else
				$el.addClass(class_name+class_size);
		}
	},
	
	/**
	 * Update margin class name
	 * 
	 * @param {jQuery Object} $el
	 */
	update_margin_classes: function ($el) {
		var el_margin = $el.data('margin'),
			ed = Upfront.Behaviors.GridEditor;
		if ( el_margin.current != el_margin.original ){
			ed.update_class($el, ed.grid.left_margin_class, el_margin.current.left);
			ed.update_class($el, ed.grid.right_margin_class, el_margin.current.right);
			ed.update_class($el, ed.grid.top_margin_class, el_margin.current.top);
			ed.update_class($el, ed.grid.bottom_margin_class, el_margin.current.bottom);
		}
	},
	
	update_model_classes: function ($el, classes) {
		var app = Upfront.Application.LayoutEditor,
			ed = Upfront.Behaviors.GridEditor,
			regions = app.layout.get('regions'),
			model;
		regions.forEach(function(region){
			var modules = region.get('modules'),
				module_model = modules.get_by_element_id($el.attr('id'));
			if ( module_model ){
				model = module_model;
			}
			else {
				modules.forEach(function(module){
					var object_model = module.get('objects').get_by_element_id($el.attr('id'));
					if ( object_model )
						model = object_model;
				})
			}
		});
		if ( model ){
			model.replace_class(classes.join(' '));
		}
	},
	
	adjust_els_right: function( adj_els, cmp_right, update_class ){
		var	ed = Upfront.Behaviors.GridEditor;
		_.each(adj_els, function(each){
			var each_margin = each.$el.data('margin'),
				each_margin_size = each.grid.left > cmp_right ? each.grid.left-cmp_right-1 : each_margin.current.left;
			if ( each_margin.current.left != each_margin_size ){
				each_margin.current.left = each_margin_size;
				if ( update_class )
					ed.update_margin_classes(each.$el);
				each.$el.data('margin', each_margin);
			}
		});
	},
	adjust_affected_right: function( adj_wrap, adj_wrap_aff_right, ignore, cmp_right, update_class ){
		var	ed = Upfront.Behaviors.GridEditor,
			wrap_el_max = ed.get_wrap_el_max(adj_wrap, ignore),
			wrap_right = wrap_el_max ? ( cmp_right && cmp_right > wrap_el_max.grid.right ? cmp_right : wrap_el_max.grid.right ) : ( cmp_right ? cmp_right : adj_wrap.grid.left-1 );
		ed.adjust_els_right(adj_wrap_aff_right, wrap_right, update_class);
		if ( cmp_right+1 == ed.containment.grid.left && ed.get_wrap_els(adj_wrap).length == 1 ) {
			adj_wrap.$el.nextAll('.upfront-wrapper:eq(0)').data('clear', 'clear');
		}
	},
	
	/**
	 * Normalize elements and wrappers 
	 */
	normalize: function (els, wraps) {
		_.each(wraps, function(wrap){
			if ( wrap.outer_grid.left == 1 && !wrap.$el.hasClass('clr') )
				wrap.$el.addClass('clr');
		});
	},
	
	/**
	 * Init the GridEditor object 
	 */
	init: function(){
		var app = Upfront.Application.LayoutEditor,
			ed = Upfront.Behaviors.GridEditor;
		ed.baseline = Upfront.Settings.LayoutEditor.Grid.baseline;
		ed.grid = Upfront.Settings.LayoutEditor.Grid;
		
		ed.max_row = Math.floor(($(window).height()*.5)/ed.baseline);
	},
	
	/**
	 * Start event, to set all required variables
	 * 
	 * @param {Object} view
	 * @param {Object} model
	 */
	start: function(view, model, $cont){
		var app = Upfront.Application.LayoutEditor,
			ed = Upfront.Behaviors.GridEditor,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			main_pos = $main.offset(),
			$layout = $main.find('.upfront-layout'),
			$grid_layout = $main.find('.upfront-grid-layout:first'),
			grid_layout_pos = $grid_layout.offset(),
			is_object = view.$el.find(".upfront-editable_entity:first").is(".upfront-object"),
			$containment = $cont || view.$el.parents(".upfront-editable_entities_container:first"),
			containment_pos = $containment.offset(),
			$els = is_object ? $containment.find('.upfront-object') : $layout.find('.upfront-module'),
			$wraps = $layout.find('.upfront-wrapper'),
			$regions = $layout.find('.upfront-region:not(.upfront-region-locked)');
		// Set variables
		ed.col_size = $('.upfront-grid-layout:first').innerWidth()/ed.grid.size;
		ed.main = {
			$el: $main,
			top: main_pos.top,
			left: main_pos.left,
			right: main_pos.left + $main.outerWidth()
		};
		ed.grid_layout = {
			top: grid_layout_pos.top,
			left: grid_layout_pos.left,
			right: grid_layout_pos.left + $grid_layout.outerWidth()
		};
		var containment_col = Math.round($containment.outerWidth()/ed.col_size),
			containment_grid = ed.get_grid(containment_pos.left, containment_pos.top);
		ed.containment = {
			$el: $containment,
			top: containment_pos.top,
			left: containment_pos.left,
			right: containment_pos.left + $containment.outerWidth(),
			col: containment_col,
			grid: { 
				top: containment_grid.y,
				left: containment_grid.x, 
				right: containment_grid.x+containment_col-1
			}
		};
		ed.els = _.map($els, ed.get_position ); // Generate elements position data
		$els.each(function(){ ed.init_margin(this); }); // Generate margin data
		ed.wraps = _.map($wraps, ed.get_position ); // Generate wrappers position data
		ed.regions = _.map($regions, ed.get_position ); // Generate regions position data
	},
	
	/**
	 * Create droppable points 
	 */
	create_drop_point: function(me, me_wrap){
		var app = Upfront.Application.LayoutEditor,
			ed = Upfront.Behaviors.GridEditor,
			margin = me.$el.data('margin'),
			col = me.col,
			row = me.row > ed.max_row ? ed.max_row : me.row,
			drop_wrap_full = '<div class="upfront-drop upfront-drop-wrap upfront-drop-wrap-full upfront-drop-y"></div>',
			drop_wrap_x = '<div class="upfront-drop upfront-drop-wrap upfront-drop-x"></div>',
			drop_wrap_fxd = '<div class="upfront-drop upfront-drop-wrap upfront-drop-x upfront-drop-fixed"></div>',
			drop = '<div class="upfront-drop upfront-drop-obj upfront-drop-y""></div>';
			
		// Add dropables in each regions
		_.each(ed.regions, function(region){
			var $region = region.$el.find(".upfront-editable_entities_container:first"),
				$wraps = $region.find('> .upfront-wrapper');
				
			$wraps.each(function(){
				var $wrap = $(this),
					wrap = ed.get_wrap($wrap),
					$prev_wrap = $wrap.prevAll('.upfront-wrapper:first'),
					$next_wrap = $wrap.nextAll('.upfront-wrapper:first'),
					wrap_el_min = ed.get_wrap_el_min(wrap);
				// Finding the droppable on inside wrapper, only if siblings wrapper exists
				if ( 
					( wrap.col >= col ) && (
					( $next_wrap.size() > 0 && !$next_wrap.hasClass('clr') && ( $next_wrap.find('.upfront-module').size() > 1 || (me_wrap && $next_wrap.get(0) != me_wrap.$el.get(0)) ) ) || 
					( $prev_wrap.size() > 0 && !$wrap.hasClass('clr') && ( $prev_wrap.find('.upfront-module').size() > 1 || (me_wrap && $prev_wrap.get(0) != me_wrap.$el.get(0)) ) ) || 
					( $next_wrap.size() > 0 && $prev_wrap.size() > 0 && !$next_wrap.hasClass('clr') && !$wrap.hasClass('clr') ) )
				){
					$els = $wrap.find('.upfront-module');
					$els.each(function(){
						if ( $(this).get(0) == me.$el.get(0) )
							return;
						var $el = $(this),
							el = ed.get_el($el);
						$el.parent().before($(drop).data('drop_size', { col: wrap.col, row: (row > el.row ? el.row : row) }));
					});
					$wrap.append($(drop).data('drop_size', { col: wrap.col, row: row }));
				}
				// Return if this is the current wrapper
				if ( me_wrap && $wrap.get(0) == me_wrap.$el.get(0) && ( $next_wrap.size() == 0 || ($next_wrap.size() > 0 && $next_wrap.hasClass('clr')) ) )
					return;
				// Add droppable before each wrapper that start in new line
				if ( $wrap.hasClass('clr') ){
					$wrap.before($(drop_wrap_full).data('drop_size', { col: region.col, row: row }));
				}
				// Check to see if the right side on wrapper has enough column to add droppable
				if ( ( $next_wrap.size() == 0 || ($next_wrap.size() > 0 && $next_wrap.hasClass('clr')) ) && region.grid.right-wrap.grid.right >= col ){
					$wrap.after($(drop_wrap_x).data('drop_size', { col: region.grid.right-wrap.grid.right, row: wrap.row }));
				}
				// Now check the left side, finding spaces between wrapper and inner modules
				if ( wrap_el_min.grid.left-wrap.grid.left >= col ){
					$wrap.before($(drop_wrap_fxd).data('drop_size', { col: wrap_el_min.grid.left-wrap.grid.left, row: wrap.row }).addClass( $wrap.hasClass('clr') ? 'clr' : '' ));
				}
			});
			if ( $wraps.size() > 0 )
				$region.append($(drop_wrap_full).data('drop_size', { col: region.col, row: row }));
			else
				$region.append($(drop_wrap_full).data('drop_size', { col: region.col, row: region.row }));
		});
		
		// Add the current dragging element droppable
		if ( me_wrap ){
			if ( me_wrap.$el.find('.upfront-module').size() > 1 ){
				// The wrapper has more than one element
				var $next = me.$el.parent().next();
				// Check if there is droppable after the element
				if ( $next.size() > 0 && $next.hasClass('upfront-drop-obj') ){
					var drop_size = $next.data('drop_size');
					drop_size.row = row;
					$next.data('drop_size', drop_size);
					$next.addClass('upfront-drop-me');
				}
			}
			else {
				var $next = me_wrap.$el.next(),
					region = ed.get_region(me_wrap.$el.closest('.upfront-region'));
				// Check if there is the wrapper start in new line and that the next droppable is full column
				if ( $next.size() > 0 && me_wrap.$el.hasClass('clr') && $next.hasClass('upfront-drop-wrap-full') ){
					var drop_size = $next.data('drop_size');
					drop_size.row = me_wrap.row;
					$next.data('drop_size', drop_size);
					$next.css('height', me_wrap.height);
					$next.addClass('upfront-drop-me');
				}
				// Check if the next droppable is a fixed one
				else if ( $next.size() > 0 && $next.hasClass('upfront-drop-fixed') ){
					var drop_size = $next.data('drop_size');
					drop_size.col += me_wrap.col;
					$next.data('drop_size', drop_size);
					$next.css('left', parseInt($next.css('left'))-me_wrap.width);
					$next.addClass('upfront-drop-me');
				}
				// Add one if the next element is not droppable
				else if ( $next.size() > 0 && $next.hasClass('upfront-wrapper') && !$next.hasClass('clr') ) {
					var next_wrap = ed.get_wrap($next),
						next_wrap_el_min = ed.get_wrap_el_min(next_wrap);
					me_wrap.$el.after(
						$(drop_wrap_fxd)
							.addClass('upfront-drop-me')
							.data('drop_size', { col: next_wrap_el_min.grid.left-me_wrap.grid.left, row: (next_wrap.row > me_wrap.row ? next_wrap.row : me_wrap.row) })
							.css('width', (next_wrap_el_min.grid.left-me_wrap.grid.left)*ed.col_size)
							.css('height', me.height)
					);
				}
				// Or add one after if the wrapper is not started in a new line
				else if ( $next.size() > 0 && !me_wrap.$el.hasClass('clr') && $next.hasClass('upfront-drop-wrap-full') ) {
					var $prev_wrap = me_wrap.$el.prevAll('.upfront-wrapper:first'),
						prev_wrap = ed.get_wrap($prev_wrap);
					me_wrap.$el.after(
						$(drop_wrap_x)
							.addClass('upfront-drop-me')
							.data('drop_size', { col: region.grid.right-me_wrap.grid.left+1, row: (prev_wrap.row > me_wrap.row ? prev_wrap.row : me_wrap.row) })
					);
				}
			}
		}
		else {
			// No wrapper? It must be from shadow region (invisible region that holds elements initial state)
			// Just add some droppable as a return point
			me.$el.after($(drop).addClass('upfront-drop-me').data('drop_size', { col: col, row: row }));
		}
		
		ed.drops = _.map($('.upfront-drop'), function(each){
			var $el = $(each),
				off = $el.offset(),
				left = off.left,
				top = off.top,
				drop_size = $(each).data('drop_size'),
				grid = ed.get_grid(left, top);
			return {
				$el: $el,
				left: grid.x,
				right: grid.x+drop_size.col-1,
				top: grid.y,
				bottom: grid.y+drop_size.row
			};
		});
		
		// Set fixed droppables to absolute position
		$('.upfront-drop-fixed').each(function(){
			var pos = $(this).position();
			$(this).css({
				position: 'absolute',
				top: pos.top,
				left: pos.left
			});
		});
		
		$('.upfront-drop').append('<div class="upfront-drop-preview" />');
	},
	
	/**
	 * Update wrappers
	 */
	update_wrappers: function (region) {
		var app = Upfront.Application.LayoutEditor,
			ed = Upfront.Behaviors.GridEditor,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			wraps = region.get('wrappers');
		$layout.find('.upfront-wrapper').each(function(){
			var $wrap = $(this),
				wrap_id = $wrap.attr('id'),
				wrap_model = wraps.get_by_wrapper_id(wrap_id),
				clear = $wrap.data('clear');
			if ( $wrap.children().size() == 0 ){
				if ( wrap_model )
					wraps.remove(wrap_model);
				return;
			}
			if ( $wrap.hasClass('upfront-wrapper-preview') )
				return;
			if ( ! wrap_model )
				return;
			var child_els = _.map($wrap.children(), function(each){
					var $el = $(each).find('>.upfront-editable_entity:first');
					return {
						$el: $el,
						col: ed.get_class_num($el, ed.grid.class),
						margin: $el.data('margin')
					};
				}),
				max = _.max(child_els, function(each){ return each.col + each.margin.current.left + each.margin.current.right; }),
				wrap_col = max.col+max.margin.current.left+max.margin.current.right;
			//ed.update_class(wrap.$el, ed.grid.class, wrap_col);
			wrap_model.replace_class(ed.grid.class+wrap_col);
			if ( (clear && clear == 'clear') || (!clear && $wrap.hasClass('clr')) )
				wrap_model.add_class('clr');
			else
				wrap_model.remove_class('clr');
		});
		wraps.each(function(wrap){
			if ( $('#'+wrap.get_wrapper_id()).size() == 0 )
				wraps.remove(wrap);
		});
	},
	
	
	/**
	 * Create resizable
	 * 
	 * @param {Object} view
	 * @param {Object} model
	 */
	create_resizable: function(view, model){
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$me = view.$el.find('.upfront-editable_entity:first'),
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout')
		;
		if ( $me.hasClass('ui-resizable') )
			return false;
		$me.append('<span class="upfront-icon-control upfront-icon-control-resize upfront-resize-handle ui-resizable-handle ui-resizable-se"></span>');
		$me.resizable({
			"containment": $layout,
			autoHide: true,
			delay: 100,
			handles: {
				se: '.upfront-resize-handle'
			},
			start: function(e, ui){
				ed.start(view, model);
				
				var col = ed.get_class_num($me, ed.grid.class),
					cls = ed.grid.class+col,
					me = ed.get_el($me),
					margin = $me.data('margin');
				cls += ' '+ed.grid.top_margin_class+margin.original.top;
				cls += ' '+ed.grid.bottom_margin_class+margin.original.bottom;
				cls += ' '+ed.grid.left_margin_class+margin.original.left;
				cls += ' '+ed.grid.right_margin_class+margin.original.right;
				
				$me.before('<div class="upfront-resize '+cls+'" style="height:'+me.height+'px;"></div>');
				// Refreshing the elements position
				_.each(ed.els, function(each, index){
					ed.els[index] = ed.get_position(each.$el);
				});
				// Refreshing the wrapper position
				_.each(ed.wraps, function(each, index){
					ed.wraps[index] = ed.get_position(each.$el);
				});
				ed.normalize(ed.els, ed.wraps);
				$me.css({
					minHeight: ''
				});
				Upfront.Events.trigger("entity:resize_start", view, view.model);
			},
			resize: function(e, ui){
				var $wrap = $me.closest('.upfront-wrapper'),
					col = ed.get_class_num($me, ed.grid.class),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
					move_limit = ed.get_move_limit(aff_els, ed.containment),
					max_col = col + (move_limit[1]-me.grid.right),
					
					current_col = Math.ceil(ui.size.width/ed.col_size),
					w = ( current_col > max_col ? Math.round(max_col*ed.col_size) : ui.size.width ),
					h = ( (ui.size.height > 15 ? ui.size.height : 0) || ui.originalSize.height ),
					rsz_col = ( current_col > max_col ? max_col : current_col ),
					rsz_row = Math.ceil(h/ed.baseline)
				;
				if ( Math.abs($(window).height()-e.clientY) < 50 ){
					h += (ed.baseline*10);
					$(window).scrollTop( $(window).scrollTop()+(ed.baseline*10) );
				}
				$me.css({
					height: h,
					width: w,
					minWidth: w,
					maxWidth: w
				});
				$me.data('resize-col', rsz_col);
				$me.data('resize-row', rsz_row);
				$me.prevAll('.upfront-resize').last().css({
					height: rsz_row*ed.baseline,
					width: rsz_col*ed.col_size,
					minWidth: rsz_col*ed.col_size,
					maxWidth: rsz_col*ed.col_size
				});
			},
			stop: function(e, ui){
				Upfront.Events.trigger("entity:pre_resize_stop", view, view.model, ui);
				var $wrap = $me.closest('.upfront-wrapper'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
					move_limit = ed.get_move_limit(aff_els, ed.containment),
					rsz_col = $me.data('resize-col'),
					rsz_row = $me.data('resize-row'),
					
					regions = app.layout.get('regions'),
					region
				;
				
				regions.each(function(reg){
					if ( reg.get('modules') == model.collection )
						region = reg;
				});
				
				$me.prevAll('.upfront-resize').last().remove();
				
				ed.update_class($me, ed.grid.class, rsz_col);
				if ( wrap )
					ed.adjust_affected_right(wrap, aff_els.right, [me], me.grid.left+rsz_col-1, true);
					
				ed.update_wrappers(region);
				
				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				$me.css({
					width: '',
					minWidth: '',
					maxWidth: '',
					height: '',
					position: '',
					top: '',
					left: ''
				});
				
				model.set_property('row', rsz_row);
				// Also resize containing object if it's only one object
				var objects = model.get('objects');
				if ( objects && objects.length == 1 ){
					objects.each(function(object){
						object.set_property('row', rsz_row-2);
					});
				}
				model.replace_class(ed.grid.class+rsz_col);
				Upfront.Events.trigger("entity:resize_stop", view, view.model, ui);
			}
		});
	},
	
	/**
	 * Create draggable
	 * 
	 * @param {Object} view
	 * @param {Object} model
	 */
	create_draggable: function(view, model){
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$me = view.$el.find('.upfront-editable_entity:first'),
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			handle_timeout
		;
		if ( model.get_property_value_by_name('disable_drag') === 1 )
			return false;
		if ( $me.hasClass('ui-draggable') )
			return false;
		/*$me.append('<div class="upfront-drag-handle" />');
		$me.hover(function () {
			handle_timeout = setTimeout(function(){ $me.addClass('handle-active'); }, 1000);
		}, function () {
			$me.removeClass('handle-active');
			clearTimeout(handle_timeout);
		});*/
		$me.draggable({
			revert: true,
			revertDuration: 0,
			zIndex: 100,
			helper: 'clone',
			delay: 100,
			//handle: '.upfront-drag-handle',
			appendTo: $main,
			start: function(e, ui){
				$main.addClass('upfront-dragging');
				
				ed.start(view, model);
				ed.normalize(ed.els, ed.wraps);
				var $helper = $('.ui-draggable-dragging'),
					$wrap = $me.closest('.upfront-wrapper'),
					$region = $me.closest('.upfront-region'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap);
				$region.css('min-height', $region.css('height'));
				$me.hide();
				$helper.css('max-width', me.width);
				$helper.css('height', me.height);
				$helper.css('max-height', ed.max_row*ed.baseline);
				ed.create_drop_point(me, wrap);
				
				$wrap.css('min-height', '1px');
				
				$('.upfront-drop-me').css('height', (me.outer_grid.bottom-me.outer_grid.top)*ed.baseline);
				
				/*_.each(ed.els, function(each){
					each.$el.find(".upfront-debug-info").size() || each.$el.find('.upfront-editable_entity:first').append('<div class="upfront-debug-info"></div>');
					each.$el.find(".upfront-debug-info").text('grid: ('+each.grid.left+','+each.grid.top+'),('+each.grid.right+','+each.grid.bottom+') | outer: ('+each.outer_grid.left+','+each.outer_grid.top+'),('+each.outer_grid.right+','+each.outer_grid.bottom+') | center: '+each.grid_center.x+','+each.grid_center.y);
				});
				_.each(ed.drops, function(each){
					each.$el.append('<div class="upfront-drop-debug">('+each.left+','+each.top+'),('+each.right+','+each.bottom+')</div>');
					var $view = $('<div class="upfront-drop-view"></div>');
					$view.css({
						top: each.top*ed.baseline,
						left: (each.left-1)*ed.col_size + (ed.grid_layout.left-ed.main.left),
						width: (each.right-each.left+1) * ed.col_size,
						height: (each.bottom-each.top) * ed.baseline
					});
					$view.text('('+each.left+','+each.right+')'+'('+each.top+','+each.bottom+')');
					$main.append($view);
				});
				$helper.find(".upfront-debug-info").size() || $helper.append('<div class="upfront-debug-info"></div>');/**/
				
				Upfront.Events.trigger("entity:drag_start", view, view.model);
			},
			drag: function(e, ui){
				var $helper = $('.ui-draggable-dragging'),
					$wrap = $me.closest('.upfront-wrapper'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
									
					move_region = !($me.closest('.upfront-region').hasClass('upfront-region-drag-active'))
					
					height = $helper.outerHeight(),
					width = $helper.outerWidth(),
					
					current_offset = $helper.offset(),
					current_left = current_offset.left,
					current_top = current_offset.top,
					current_bottom = current_top+height,
					current_right = current_left+width,
					current_x = current_left+(width/2),
					current_y = current_top+(height/2),
					
					current_grid = ed.get_grid(current_left, current_top),
					current_grid_left = current_grid.x,
					current_grid_top = current_grid.y,
					current_grid2 = ed.get_grid(current_right, current_bottom),
					current_grid_right = current_grid2.x-1,
					current_grid_bottom = current_grid2.y-1,
					
					grid = ed.get_grid(e.pageX, e.pageY),
					col = ed.get_class_num($me, ed.grid.class),
					
					compare_area_top = current_grid_top,
					compare_area_left = current_grid_left,
					compare_area_right = current_grid_right,
					//compare_area_right = grid.x-compare_area_left+grid.x,
					//compare_area_right = compare_area_right > current_grid_right ? current_grid_right : compare_area_right,
					compare_area_bottom = grid.y-compare_area_top+grid.y,
					compare_area_bottom = compare_area_bottom > current_grid_bottom ? current_grid_bottom : compare_area_bottom,
					compare_are_bottom = compare_area_bottom > compare_area_top+ed.max_row ? compare_area_top+ed.max_row : compare_area_bottom,
					
					// Figure out the margin
					margin_data = $me.data('margin'),
					
					relative_left = current_grid_left - me.grid.left,
					relative_top = current_grid_top - me.grid.top,
					
					margin_size = margin_data.original.left + relative_left,
					margin_top_size = margin_data.original.top + relative_top,
					
					aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
					move_limit = ed.get_move_limit(aff_els, ed.containment),
					
					max_margin_x = 0,
					max_margin_y = 0,
					recalc_margin_x = false,
					recalc_margin_y = false;
				
				//console.log([grid.x, grid.y, compare_area_top, compare_area_right, compare_area_bottom, compare_area_left]);
				
				// Finding the regions we currently on
				var $last_region_container = $('.upfront-region-container:not(.upfront-region-container-shadow):last'),
					regions_area = _.map(ed.regions, function(each){
						var top, bottom, left, right, area,
							region_bottom = ( each.$el.closest('.upfront-region-container').get(0) == $last_region_container.get(0) ) ? 999999 : each.grid.bottom; // Make this bottom-less if it's in the last region container
						if ( compare_area_left >= each.grid.left && compare_area_left <= each.grid.right )
							left = compare_area_left;
						else if ( compare_area_left < each.grid.left )
							left = each.grid.left;
						if ( compare_area_right >= each.grid.left && compare_area_right <= each.grid.right )
							right = compare_area_right;
						else if ( compare_area_right > each.grid.right )
							right = each.grid.right;
						if ( compare_area_top >= each.grid.top && compare_area_top <= region_bottom )
							top = compare_area_top;
						else if ( compare_area_top < each.grid.top )
							top = each.grid.top;
						if ( compare_area_bottom >= each.grid.top && compare_area_bottom <= region_bottom )
							bottom = compare_area_bottom;
						else if ( compare_area_bottom > region_bottom )
							bottom = region_bottom;
						if ( top && bottom && left && right && grid.x > 0 && grid.x <= ed.grid.size )
							area = (right-left+1) * (bottom-top+1);
						else
							area = 0;
						if ( each.$el.hasClass('upfront-region-drag-active') )
							area *= 1.2;
						return {
							area: area,
							region: each
						}
					}),
					max_region = _.max(regions_area, function(each){ return each.area; }),
					region = max_region.area > 0 ? max_region.region : ed.get_region($me.closest('.upfront-region'));
				
				_.each(regions_area, function(r){
					r.region.$el.find('>.upfront-debug-info').text(r.area);
				});
				
				if ( !region.$el.hasClass('upfront-region-drag-active') ){				
					$('.upfront-region-drag-active').removeClass('upfront-region-drag-active');
					region.$el.addClass('upfront-region-drag-active');
				}
				
				//$helper.css('max-width', region.col*ed.col_size);
				
				col = col > region.col ? region.col : col;
				compare_area_right = compare_area_left+col-1;
				
				
				var drops_area = _.map(ed.drops, function(each){
						if ( !each.$el.closest('.upfront-region').hasClass('upfront-region-drag-active') )
							return false;
						var top, bottom, left, right, area;
						if ( compare_area_left >= each.left && compare_area_left <= each.right )
							left = compare_area_left;
						else if ( compare_area_left < each.left )
							left = each.left;
						if ( compare_area_right >= each.left && compare_area_right <= each.right )
							right = compare_area_right;
						else if ( compare_area_right > each.right )
							right = each.right;
						if ( compare_area_top >= each.top && compare_area_top <= each.bottom )
							top = compare_area_top;
						else if ( compare_area_top < each.top )
							top = each.top;
						if ( compare_area_bottom >= each.top && compare_area_bottom <= each.bottom )
							bottom = compare_area_bottom;
						else if ( compare_area_bottom > each.bottom )
							bottom = each.bottom;
						if ( top && bottom && left && right && grid.x > 0 && grid.x <= ed.grid.size )
							area = (right-left+1) * (bottom-top+1);
						else
							area = 0;
						if ( each.$el.hasClass('upfront-drop-me') )
							area *= 1.5;
						else if ( each.$el.hasClass('upfront-drop-use') )
							area *= 1.2;
						/*else if ( each.$el.hasClass('upfront-drop-fixed') )
							area *= 1.3;
						else if ( each.$el.hasClass('upfront-drop-obj') )
							area *= 1.2;*/
						return {
							area: area,
							drop: each
						}
					}).filter(function(each){
						if ( each !== false )
							return true;
						return false;
					}),
					max_drop = _.max(drops_area, function(each){ return each.area; });
				
				if ( max_drop.area > 0 ){
					var max_drops = _.filter(drops_area, function(each){ return each.area == max_drop.area; }),
						max_drops_sort = _.sortBy(max_drops, function(each, index, list){
							if ( each.drop.$el.hasClass('upfront-drop-fixed') )
								return 2;
							else if ( each.drop.$el.hasClass('upfront-drop-wrap-full') )
								return 5;
							return 3;
						}),
						drop = _.first(max_drops_sort).drop;
				}
				else {
					if ( region.$el.find('.upfront-drop-me').size() > 0 ){
						var drop = ed.get_drop($('.upfront-drop-me'));
					}
					else {
						var $first_drop = region.$el.find('.upfront-drop:first'),
							first_drop = ed.get_drop($first_drop),
							$last_drop = region.$el.find('.upfront-drop:last'),
							last_drop = ed.get_drop($last_drop);
						if ( compare_area_top < region.grid.top + ((region.grid.bottom-region.grid.top)/2) )
							var drop = first_drop;
						else
							var drop = last_drop;
					}
				}
				
				var $preview = drop.$el.find('.upfront-drop-preview'),
					preview_left = 0,
					preview_top = 0;
				
				if ( !drop.$el.hasClass('upfront-drop-use') ){
					$('.upfront-drop-use').removeClass('upfront-drop-use');
					$('.upfront-drop-x').not(drop.$el).stop().animate({width:0}, 500);
					$('.upfront-drop-y').not(drop.$el).not('.upfront-drop-me.upfront-drop-wrap').stop().animate({height:0}, 500);
					if ( drop.$el.hasClass('upfront-drop-x') ){
						var ani_w = Math.floor((drop.right-drop.left+1)*ed.col_size),
							ani_h = (drop.bottom-drop.top)*ed.baseline;
						drop.$el.addClass('upfront-drop-use').stop().css('width', ani_w).css('height', ani_h);
					}
					else{
						var ani_h = drop.$el.hasClass('upfront-drop-me') ? (me.outer_grid.bottom-me.outer_grid.top)*ed.baseline : height;
						drop.$el.addClass('upfront-drop-use').stop().animate({height:ani_h}, 500);
					}
					$preview.css({
						width: col*ed.col_size,
						height: height
					});
				}
				
				// normalize all margin first
				_.each(ed.els, function(each){
					var each_margin = each.$el.data('margin');
					each_margin.current.left = each_margin.original.left;
					each_margin.current.right = each_margin.original.right;
					each_margin.current.top = each_margin.original.top;
					each_margin.current.bottom = each_margin.original.bottom;
					each.$el.data('margin', each_margin);
				});
				// normalize clear
				_.each(ed.wraps, function(each){
					each.$el.data('clear', (each.$el.hasClass('clr') ? 'clear' : 'none'));
				});
				
				if ( drop.$el.hasClass('upfront-drop-me') ){
					// Not moving so calculate margin
				
					// Calculate margins
					max_margin_x = move_limit[1]-move_limit[0]-col+1;
					
					margin_size = margin_size > 0 ? (margin_size > max_margin_x ? max_margin_x : margin_size) : 0;
					if ( margin_data.current.left != margin_size ){
						margin_data.current.left = margin_size;
						$me.data('margin', margin_data);
						recalc_margin_x = true;
					}
					
					margin_data.current.top = margin_top_size > 0 ? margin_top_size : 0;
					$me.data('margin', margin_data);
					
					// Recalculate margin so the affected elements remain in their position
					if ( recalc_margin_x ){
						if ( wrap )
							ed.adjust_affected_right(wrap, aff_els.right, [me], move_limit[0]+col+margin_size-1);
						//else
						//	ed.adjust_els_right(aff_els.right, move_limit[0]+col+margin_size-1);
					}
					preview_left = margin_data.current.left;
					preview_top = margin_data.current.top;
				}
				else { // Moved
					if ( wrap )
						ed.adjust_affected_right(wrap, aff_els.right, [me], wrap.grid.left-1);
				//	else
				//		ed.adjust_els_right(aff_els.right, me.grid.left-1);
					margin_data.current.left = 0;
					margin_data.current.top = 0;
					margin_data.current.right = 0;
					margin_data.current.bottom = 0;
					if ( drop.$el.hasClass('upfront-drop-wrap') && drop.$el.hasClass('upfront-drop-fixed') ){
						var adjusted = false;
						if ( drop.$el.nextAll('.upfront-wrapper').size() > 0 ){
							var $nx_wrap = drop.$el.nextAll('.upfront-wrapper').eq(0),
								nx_wrap = _.find(ed.wraps, function(each){ return $nx_wrap.get(0) == each.$el.get(0); }),
								need_adj = _.filter(ed.get_wrap_els(nx_wrap), function(each){
									return ( me.$el.get(0) != each.$el.get(0) && each.outer_grid.left == nx_wrap.grid.left )
								}),
								need_adj_min = ed.get_wrap_el_min(nx_wrap),
								drop_margin = current_grid_left-nx_wrap.grid.left,
								drop_margin_top = current_grid_top-nx_wrap.grid.top,
								adjusted = false;
							if ( ! $nx_wrap.hasClass('clr') || drop.$el.hasClass('clr') ){
								var drop_margin_max = need_adj_min.grid.left-nx_wrap.grid.left-col;
								margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
								margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
								ed.adjust_els_right(need_adj, nx_wrap.grid.left+col+margin_data.current.left-1);
								$nx_wrap.data('clear', 'none');
								adjusted = true;
							}
						}
						if ( ! adjusted ){
							var drop_margin = drop ? current_grid_left-drop.left : current_grid_left,
								drop_margin_max = drop ? drop.right-drop.left-col+1 : 0,
								drop_margin_top = drop ? current_grid_top-drop.top : current_grid_top;
							margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
							margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
						}
						preview_left = margin_data.current.left;
						preview_top = margin_data.current.top;
					}
					else if ( !drop.$el.hasClass('upfront-drop-wrap') ) {
						var $drop_wrap = drop.$el.closest('.upfront-wrapper'),
							drop_wrap = _.find(ed.wraps, function(each){
								return ( each.$el.get(0) == $drop_wrap.get(0) );
							}),
							drop_wrap_aff = drop_wrap ? ed.get_affected_wrapper_els(drop_wrap, ed.wraps, (wrap && ed.get_wrap_els(wrap).length == 1 ? [wrap, me] : [me]), true) : false,
							drop_lmt = drop_wrap ? ed.get_move_limit(drop_wrap_aff, ed.containment) : false,
							drop_margin = drop_wrap ? current_grid_left-drop_lmt[0] : 0,
							drop_margin_max = drop_wrap ? drop_lmt[1]-drop_lmt[0]-col+1 : 0,
							drop_margin_top = drop ? current_grid_top-drop.top : current_grid_top;
						margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
						margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
						preview_left = margin_data.current.left;
						preview_top = margin_data.current.top;
						if ( drop_wrap ){
							ed.adjust_affected_right(drop_wrap, drop_wrap_aff.right, [me], drop_lmt[0]+col+margin_data.current.left-1);
							preview_left -= drop_wrap.grid.left-drop_lmt[0];
						}
					}
					else if ( drop.$el.hasClass('upfront-drop-wrap-full') || (drop.$el.hasClass('upfront-drop-wrap') && drop.$el.hasClass('upfront-drop-x')) ){
						var drop_margin = drop ? current_grid_left-drop.left : current_grid_left,
							drop_margin_max = drop ? drop.right-drop.left-col+1 : 0,
							drop_margin_top = current_grid_top-drop.top;
						margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
						margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
						preview_left = margin_data.current.left;
						preview_top = margin_data.current.top;
					}
					$me.data('margin', margin_data);
				}
				
				$preview.css({
					marginLeft: preview_left * ed.col_size,
					marginTop: preview_top * ed.baseline
				});
				
				
				//$helper.find(".upfront-debug-info").text('grid: '+grid.x+','+grid.y+' | current: ('+current_grid_left+','+current_grid_top+'),('+current_grid_right+','+current_grid_bottom+') | margin size: '+margin_data.current.top+'/'+margin_data.current.left+','+margin_data.current.right);
				
			},
			stop: function(e, ui){
				var $wrap = $me.closest('.upfront-wrapper'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					col = ed.get_class_num($me, ed.grid.class),
					$drop = $('.upfront-drop-use'),
					is_object = view.$el.find(".upfront-editable_entity:first").is(".upfront-object"),
					dropped = false,
					regions = app.layout.get("regions");
					region = regions.get_by_name( $('.upfront-region-drag-active').data('name') ),
					wrappers = region.get('wrappers'),
					move_region = !($me.closest('.upfront-region').hasClass('upfront-region-drag-active'));
				
				if ( $drop.hasClass('upfront-drop-me') ){
					$wrap.show();
					drop_update();
				}
				else {
					dropped = true;
					if ( $drop.hasClass('upfront-drop-wrap') ){
						var wrapper_id = Upfront.Util.get_unique_id("wrapper");
							wrap_model = new Upfront.Models.Wrapper({
								"name": "",
								"properties": [
									{"name": "wrapper_id", "value": wrapper_id},
									{"name": "class", "value": ed.grid.class+col}
								]
							}),
							wrap_view = new Upfront.Views.Wrapper({model: wrap_model});
						wrappers.add(wrap_model);
						if ( $drop.hasClass('upfront-drop-wrap-full') || $drop.hasClass('clr') )
							wrap_model.add_class('clr');
						wrap_view.render();
						wrap_view.$el.append(view.$el);
						if ( $drop.hasClass('upfront-drop-fixed') && $drop.hasClass('clr') )
							$drop.nextAll('.upfront-wrapper').eq(0).removeClass('clr');
						$drop.before(wrap_view.$el);
						Upfront.data.wrapper_views[wrap_model.cid] = wrap_view;
					}
					else {
						var $drop_wrap = $drop.closest('.upfront-wrapper'),
							wrapper_id = $drop_wrap.attr('id');
						$drop.before(view.$el);
					}
					if ( $wrap.children(':not(.upfront-drop)').size() == 0 ){
						if ( wrap && wrap.grid.left == 1 )
							$wrap.nextAll('.upfront-wrapper').eq(0).addClass('clr');
						$wrap.remove();
					}
					var $me_drop_full = $('.upfront-drop-me.upfront-drop-wrap-full');
					if ( $me_drop_full.size() > 0 && $('.upfront-drop').index($me_drop_full) < $('.upfront-drop').index($drop) ){
						// animate the previous drop area for smooth transition
						$('.upfront-region').css('min-height', '');
						$me_drop_full.stop().animate({height: 0}, 1000, 'swing', function(){
							drop_update();
						});
					}
					else {
						drop_update();
					}
				}
				function drop_update () {
					$('.upfront-drop').remove();
					$('.upfront-drop-view').remove();
					
					( is_object ? ed.containment.$el.find('.upfront-object') : $layout.find('.upfront-module') ).each(function(){
						ed.update_margin_classes($(this));
					});
					
					ed.update_wrappers(region);
					$me.show();
					
					// Update model value
					( is_object ? ed.containment.$el.find('.upfront-object') : $layout.find('.upfront-module') ).each(function(){
						var $el = $(this),
							margin = $el.data('margin');
						if ( margin && 
							( margin.original.left != margin.current.left ||
							margin.original.top != margin.current.top ||
							margin.original.bottom != margin.current.bottom ||
							margin.original.right != margin.current.right )
						){
							ed.update_model_classes($el, [
								ed.grid.left_margin_class+margin.current.left,
								ed.grid.right_margin_class+margin.current.right,
								ed.grid.top_margin_class+margin.current.top,
								ed.grid.bottom_margin_class+margin.current.bottom
							]);
						}
					});
					
					if ( wrapper_id )
						model.set_property('wrapper_id', wrapper_id, true);
					
					if ( !move_region ){
						view.resort_bound_collection();
					}
					else {
						var modules = region.get('modules'),
							models = [];
						model.collection.remove(model, {silent: true});
						model.unset('shadow', {silent: true});
						$me.removeAttr('data-shadow');
						$('.upfront-region-drag-active').find('.upfront-module').each(function(){
							var element_id = $(this).attr('id'),
								each_model = modules.get_by_element_id(element_id);
							if ( !each_model && element_id == $me.attr('id') )
								models.push(model);
							else
								models.push(each_model);
						});
						modules.reset(models);
					}
					
					// Add drop animation
					$me = view.$el.find('.upfront-editable_entity:first');
					$me.one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(){
						$(this).removeClass('upfront-dropped'); 
						Upfront.Events.trigger("entity:drag_animate_stop", view, view.model);
					}).addClass('upfront-dropped');
					
					$('.upfront-region-drag-active .upfront-module').css('max-height', '');
					$('.upfront-region-drag-active').removeClass('upfront-region-drag-active');
					$wrap.css('min-height', '');
					$main.removeClass('upfront-dragging');
					
					Upfront.Events.trigger("entity:drag_stop", view, view.model);
					view.trigger("entity:self:drag_stop");
				}
			}
		});
	},
	
	refresh_draggables: function(){
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout');
		$layout.find('.ui-draggable').each(function(){
			var cursor_top = $(this).outerHeight() > 60 ? 60 : $(this).outerHeight()/2;
			$(this).draggable('option', 'cursorAt', {top: cursor_top});
		});
		
	},
	
	
	/**
	 * Create region resizable
	 * 
	 * @param {Object} view
	 * @param {Object} model
	 */
	create_region_resizable: function(view, model){
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$me = view.$el,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout')
		;
		if ( !model.get("container") || model.get("container") == model.get("name") )
			return;
		$me.resizable({
			"containment": "parent",
			//handles: "n, e, s, w",
			handles: "e, w",
			helper: "region-resizable-helper",
			disabled: true,
			start: function(e, ui){
				var col = ed.get_class_num($me, ed.grid.class);
				ed.col_size = $('.upfront-grid-layout:first').outerWidth()/ed.grid.size;
				
				Upfront.Events.trigger("entity:region:resize_start", view, view.model);
			},
			resize: function(e, ui){
				var $helper = ui.helper;
					col = ed.get_class_num($me, ed.grid.class),
					prev_col = $me.prev('.upfront-region').size() > 0 ? ed.get_class_num($me.prev('.upfront-region'), ed.grid.class) : 0,
					next_col = $me.next('.upfront-region').size() > 0 ? ed.get_class_num($me.next('.upfront-region'), ed.grid.class) : 0,
					max_col = col + ( next_col > prev_col ? next_col : prev_col ),
					current_col = Math.ceil(ui.size.width/ed.col_size),
					w = ( current_col > max_col ? Math.round(max_col*ed.col_size) : ui.size.width ),
					h = ( (ui.size.height > 15 ? ui.size.height : 0) || ui.originalSize.height ),
					rsz_col = ( current_col > max_col ? max_col : current_col ),
					rsz_row = Math.ceil(h/ed.baseline)
				;
				if ( Math.abs($(window).height()-e.clientY) < 50 ){
					h += (ed.baseline*10);
					$(window).scrollTop( $(window).scrollTop()+(ed.baseline*10) );
				}
				$helper.css({
					height: h,
					width: w,
					minWidth: w,
					maxWidth: w
				});
				$me.data('resize-col', rsz_col);
				$me.data('resize-row', rsz_row);
				/*$me.prevAll('.upfront-resize').last().css({
					height: rsz_row*ed.baseline,
					width: rsz_col*ed.col_size,
					minWidth: rsz_col*ed.col_size,
					maxWidth: rsz_col*ed.col_size
				});*/
			},
			stop: function(e, ui){
				var rsz_col = $me.data('resize-col'),
					rsz_row = $me.data('resize-row');
				
				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				$me.css({
					width: '',
					minWidth: '',
					maxWidth: '',
					height: '',
					position: '',
					top: '',
					left: ''
				});
				model.set_property('col', rsz_col);
				model.set_property('row', rsz_row);
				Upfront.Events.trigger("entity:region:resize_stop", view, view.model);
			}
		});
	},
	
	/**
	 * Toggle region resizable
	 * 
	 */
	toggle_region_resizable: function(enable){
		$('.upfront-region').each(function(){		
			if ( !$(this).data('resizable') )
				return;
			$(this).resizable('option', 'disabled', (!enable));
		});
	}
	
	
};

define({
	"Behaviors": {
		"LayoutEditor": LayoutEditor,
		"GridEditor": GridEditor
	}
});
})(jQuery);
//@ sourceURL=upfront-behavior.js