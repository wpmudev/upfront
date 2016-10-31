(function ($) {

define([
	'scripts/upfront/behaviors/dragdrop',
	'scripts/upfront/behaviors/resize'
], function (DragDrop, Resize) {

var GridEditor = {
	lightbox_cols: false,
	main: {$el: null, top: 0, left: 0, right: 0},
	grid_layout: {top: 0, left: 0, right: 0},
	containment: {$el: null, top: 0, left: 0, right: 0, col: 0, grid: {top: 0, left: 0, right: 0}},
	min_col: 1,
	max_row: 0,
	compare_col: 2,
	compare_row: 10,
	focus_compare_col: 1,
	focus_compare_row: 3,
	update_distance: 10, // distance from last recorded coordinate before issuing update, in px
	timeout: 0, // in ms
	focus_timeout: 500, // in ms
	focus: false,
	focus_out_distance: 50,
	focus_coord: {x: 0, y: 0},
	_t: null, // timeout resource
	_t_focus: null, // timeout resource for focus
	col_size: 0,
	baseline: 0,
	grid: null,

	// some more configurable setting
	region_type_priority: {
		wide: 1,
		clip: 1,
		full: 1,
		fixed: 2,
		lightbox: 2
	},

	els: [],
	wraps: [],
	regions: [],
	drops: [],

	drop: null,

	el_selector: '',
	el_selector_direct: '',
	module_selector: '.upfront-module-view > .upfront-module, .upfront-module-group',
	module_selector_direct: '> .upfront-module-view > .upfront-module, > .upfront-module-group',
	object_selector: '.upfront-object-view > .upfront-object',
	object_selector_direct: '> .upfront-object-view > .upfront-object',

	_id: 0,

	drag_instances: {},
	resize_instances: {},
	wrapper_resize_instances: {},

	show_debug_element: false,

	resizing: false,

	/**
	 * Return a new incremented internal counter
	 */
	_new_id: function(){
		var ed = Upfront.Behaviors.GridEditor;
		ed._id++;
		return ed._id;
	},

	/**
	 * Get grid position of an x,y offset
	 *
	 * @param {Int} x
	 * @param {Int} y
	 */
	get_grid: function(x, y){
		var	ed = Upfront.Behaviors.GridEditor,
			grid_x = !Upfront.Util.isRTL()
				? Math.round((x-ed.grid_layout.left)/ed.col_size)+1
				: Math.round((ed.grid_layout.right-x)/ed.col_size)+1,
			grid_y = Math.ceil((y-ed.grid_layout.top)/ed.baseline)+1;
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
			width = parseFloat($el.css('width')),
			height = parseFloat($el.css('height')),
			offset = $el.offset(),
			top = offset.top,
			bottom = top + height,
			left = !Upfront.Util.isRTL() ? offset.left : offset.left + width,
			right = !Upfront.Util.isRTL() ? left + width : left - width,
			grid = ed.get_grid(left, top),
			col = ($el.data('current_col') ? $el.data('current_col') : Math.round(width/ed.col_size)),
			row = Math.floor(height/ed.baseline),
			//$region = $el.closest('.upfront-region'),
			//region = $region.data('name'),
			//$group = $el.closest('.upfront-module-group'),
			//group = $group.length > 0 ? $group.attr('id') : false,
			position = {
				top: Math.round(top),
				left: Math.round(left),
				bottom: Math.round(bottom),
				right: Math.round(right)
			},
			pos_grid = {
				top: grid.y,
				left: grid.x,
				right: grid.x+col-1,
				bottom: grid.y+row-1
			}
		;
		return {
			$el: $el,
			_id: ed._new_id(),
			position: position,
			outer_position: position, // Backward compatibility, to be deprecated
			width: width,
			height: height,
			center: {
				y: Math.round(top+(height/2)),
				x: !Upfront.Util.isRTL() ? Math.round(left+(width/2)) : Math.round(left-(width/2))
			},
			col: col,
			row: row,
			grid: pos_grid,
			outer_grid: pos_grid, // Backward compatibility, to be deprecated
			grid_center: {
				y: grid.y+(row/2)-1,
				x: grid.x+(col/2)-1
			}
			//region: region,
			//group: group
		};
	},

	get_region_position: function (el) {
		var ed = Upfront.Behaviors.GridEditor,
			$el = $(el),
			$modules_container = $el.find('.upfront-modules_container'),
			position = ed.get_position($modules_container);
		position.$el = $el;
		return position;
	},

	/**
	 * Get margin from class name and store in data to use later
	 *
	 * @param {Object} el
	 */
	init_margin: function (el){
		var ed = Upfront.Behaviors.GridEditor,
			left = Math.round(parseFloat(el.$el.css('margin-left'))/ed.col_size),
			top = Math.round(parseFloat(el.$el.css('margin-top'))/ed.baseline)
		;
		el.$el.data('margin', {
			original: {
				left: left,
				top: top
			},
			current: {
				left: left,
				top: top
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
				if ( el.group != each.group )
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
			if ( each.grid.right > move_limit[0] ) {
				move_limit[0] = each.grid.right+1;
			}
		});
		_.each(aff_els.right, function(each){
			if ( each.grid.left < move_limit[1] ) {
				move_limit[1] = each.grid.left-1;
			}
		});
		return move_limit;
	},

	get_resize_limit: function (aff_els, containment) {
		var resize_limit = [containment.grid.left, containment.grid.right];
		_.each(aff_els.left, function(each){
			if ( each.grid.left > resize_limit[0] ) {
				resize_limit[0] = each.grid.left;
			}
		});
		_.each(aff_els.right, function(each){
			if ( each.grid.right < resize_limit[1] ) {
				resize_limit[1] = each.grid.right;
			}
		});
		return resize_limit;
	},

	/**
	 * Get maximum size available to resize
	 *
	 * @param (object) el
	 * @param (array) els
	 * @param (object) region
	 * @param (string) axis nw|se|all
	 */
	get_max_size: function ( el, els, region, axis ) {
		var ed = Upfront.Behaviors.GridEditor,
			col = ed.get_class_num(el.$el, ed.grid['class']),
			axis = /all|nw|se/.test(axis) ? axis : 'all',
			margin = el.$el.data('margin'),
			aff_els = ed.get_affected_els(el, els, [], true),
			move_limit = ed.get_move_limit(aff_els, ed.containment),
			max_col = ( axis == 'nw' ? col+el.grid.left-move_limit[0] : ( axis == 'se' ? col+move_limit[1]-el.grid.right : move_limit[1]-move_limit[0]+1 ) ),
			expand_lock = region.$el.hasClass('upfront-region-expand-lock'),
			top_aff_el = aff_els.bottom.length ? _.min(aff_els.bottom, function(each){ return each.grid.top; }) : false,
			max_row_se = top_aff_el ? top_aff_el.grid.top-el.grid.top : region.grid.bottom-el.grid.top,
			max_row =  axis == 'nw' ? margin.original.top+el.row : ( axis == 'se' ? max_row_se : max_row_se+margin.original.top );
		return {
			col: max_col,
			row: expand_lock || axis == 'nw' ? max_row : false
		};
	},


	get_wrap_els: function( use_wrap ){
		var ed = Upfront.Behaviors.GridEditor,
			$els = use_wrap.$el.find(ed.el_selector_direct);
		return _.map($els, function(el){
			var el = ed.get_el($(el));
			return _.find(ed.els, function(each){ return each._id == el._id; });
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
		return _.find(ed.els, function(each){ return ( $el.get(0) == each.$el.get(0) ); });
	},

	/**
	 * Get wrapper position data
	 *
	 * @param {jQuery Object} $wrap
	 */
	get_wrap: function ($wrap){
		var ed = Upfront.Behaviors.GridEditor;
		return _.find(ed.wraps, function(each){ return ( $wrap.get(0) == each.$el.get(0) ); });
	},

	/**
	 * Get region position data
	 *
	 * @param {jQuery Object} $region
	 */
	get_region: function ($region){
		var ed = Upfront.Behaviors.GridEditor;
		return _.find(ed.regions, function(each){ return ( $region.get(0) == each.$el.get(0) ); });
	},

	/**
	 * Get drop data
	 *
	 * @param {jQuery Object} $region
	 */
	get_drop: function ($drop){
		var ed = Upfront.Behaviors.GridEditor;
		return _.find(ed.drops, function(each){ return ( $drop.get(0) == each.$el.get(0) ); });
	},

	/**
	 * Get integer value from class name
	 *
	 * @param {jQuery Object|String} from
	 * @param {String} class_name
	 */
	get_class_num: function (from, class_name){
		var text = _.isString(from) ? from : from.attr('class'),
			rx = new RegExp('\\b' + class_name + '(\\d+)'),
			val = text.match(rx);
		return ( val && val[1] ) ? parseInt(val[1], 10) : 0;
	},

	/**
	 * Get element model
	 *
	 * @param {jQuery Object} $el
	 */
	get_el_model: function ($el) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			regions = app.layout.get('regions'),
			element_id = $el.attr('ref-id') || $el.attr('id'),
			find_model = function (modules) {
				if ( !modules )
					return false;
				
				if ( !modules.get_by_element_id && typeof modules.get_by_element_id !== 'function')
					return false;
				
				var module_model = modules.get_by_element_id(element_id),
					found_model;
				if ( module_model )
					return module_model;
				modules.find(function(module){
					if ( module.get('modules') ) {
						found_model = find_model(module.get('modules'));
						return found_model ? true : false;
					}
					else if ( module.get('objects') ) {
						found_model = find_object(module.get('objects'));
						return found_model ? true : false;
					}
				});
				return found_model;
			},
			find_object = function (objects) {
				if ( !objects )
					return false;
				
				if ( !objects.get_by_element_id && typeof objects.get_by_element_id !== 'function')
					return false;
				
				var object_model = objects.get_by_element_id(element_id),
					found_object;
				if ( object_model )
					return object_model;
				objects.find(function(object){
					if ( object.get('objects') ) {
						found_object = find_object(object.get('objects'));
						return found_object ? true : false;
					}
				});
				return found_object;
			},
			model;
		regions.find(function(region){
			model = find_model(region.get('modules'));
			return model ? true : false;
		});
		return model ? model : false;
	},

	/**
	 * Update class name with new value
	 *
	 * @param {jQuery Object} $el
	 * @param {String} class_name
	 * @param {Int} class_size
	 */
	update_class: function ($el, class_name, class_size) {
		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			rx = new RegExp('\\b' + class_name + '\\d+'),
			$parent, parent_col;
		if ( !breakpoint || breakpoint['default'] ){ // apply class if default
			if ( ! $el.hasClass(class_name+class_size) ){
				if ( $el.attr('class').match(rx) )
					$el.attr('class', $el.attr('class').replace(rx, class_name+class_size));
				else
					$el.addClass(class_name+class_size);
			}
		}
		else { // otherwise, inline style
			$parent = $el.parent();
			parent_col = Math.round($parent.width()/this.col_size);
			if ( class_name == 'c' )
				$el.css('width', ((class_size/parent_col)*100) + '%');
			else if ( class_name == 'ml' )
				$el.css('margin-left', ((class_size/parent_col)*100) + '%');
			else if ( class_name == 'mt' )
				$el.css('margin-top', (class_size*this.baseline) + 'px');
		}
	},

	/**
	 * Update margin class name
	 *
	 * @param {jQuery Object} $el
	 */
	update_margin_classes: function ($el) {
		this.time_start('fn update_margin_classes');
		var el_margin = $el.data('margin'),
			ed = Upfront.Behaviors.GridEditor;
		if ( el_margin.current != el_margin.original ){
			ed.update_class($el, ed.grid.left_margin_class, el_margin.current.left);
			ed.update_class($el, ed.grid.top_margin_class, el_margin.current.top);
		}
		this.time_end('fn update_margin_classes');
	},

	update_model_classes: function ($el, classes) {
		this.time_start('fn update_model_classes');
		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			model = this.get_el_model($el);
		if ( model && ( !breakpoint || breakpoint['default'] ) ){
			model.replace_class(classes.join(' '));
		}
		this.time_end('fn update_model_classes');
	},

	update_model_breakpoint: function ($el, data) {
		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			model = this.get_el_model($el),
			model_breakpoint;
		if ( model && breakpoint && !breakpoint['default'] ){
			model_breakpoint = Upfront.Util.clone(model.get_property_value_by_name('breakpoint') || {});
			if ( !_.isObject(model_breakpoint[breakpoint.id]) )
				model_breakpoint[breakpoint.id] = {};
			model_breakpoint[breakpoint.id] = _.extend(model_breakpoint[breakpoint.id], data);
			model_breakpoint[breakpoint.id].edited = true;
			model.set_property('breakpoint', model_breakpoint);
		}
	},

	update_model_margin_classes: function ($els, more_classes) {
		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			ed = Upfront.Behaviors.GridEditor;
		$els.each(function(){
			var $el = $(this),
				margin = $el.data('margin'),
				classes, data, margin_top, margin_left;
			if (
				( margin && ( margin.original.left != margin.current.left || margin.original.top != margin.current.top ) ) ||
				more_classes
			){
				margin_top = margin ? margin.current.top : 0;
				margin_left = margin ? margin.current.left : 0;
				if ( !breakpoint || breakpoint['default'] ){
					classes = [
						ed.grid.left_margin_class+margin_left,
						ed.grid.top_margin_class+margin_top
					];
					if ( more_classes ) {
						classes = _.union(classes, more_classes);
					}
					ed.update_model_classes($el, classes);
				}
				else {
					data = {
						left: margin_left,
						top: margin_top
					};
					if ( more_classes )
						_.each(more_classes, function(classname){
							var parse = classname.match(/^([A-Za-z])(\d+)$/);
							if ( parse && parse[1] == ed.grid['class'] ) {
								data.col = parseInt(parse[2]);
							}
						});
					ed.update_model_breakpoint($el, data);
				}
			}
		});
	},

	adjust_els_right: function( adj_els, cmp_right, update_class ){
		this.time_start('fn adjust_els_right');
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
		this.time_end('fn adjust_els_right');
	},

	adjust_affected_right: function( adj_wrap, adj_wrap_aff_right, ignore, cmp_right, update_class ){
		this.time_start('fn adjust_affected_right');
		var	ed = Upfront.Behaviors.GridEditor,
			wrap_el_max = ed.get_wrap_el_max(adj_wrap, ignore),
			wrap_right = wrap_el_max ? ( cmp_right && cmp_right > wrap_el_max.grid.right ? cmp_right : wrap_el_max.grid.right ) : ( cmp_right ? cmp_right : adj_wrap.grid.left-1 );
		adj_wrap_aff_right = _.reject(adj_wrap_aff_right, function(el){
			return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false;
		});
		ed.adjust_els_right(adj_wrap_aff_right, wrap_right, update_class);
		if ( cmp_right+1 == ed.containment.grid.left && ed.get_wrap_els(adj_wrap).length == 0 ) {
			adj_wrap.$el.nextAll('.upfront-wrapper:eq(0)').data('clear', 'clear'); // @TODO check this
		}
		this.time_end('fn adjust_affected_right');
	},

	adjust_els_bottom: function ( adj_els, cmp_bottom, update_class ) {
		this.time_start('fn adjust_els_bottom');
		var	ed = Upfront.Behaviors.GridEditor;
		_.each(adj_els, function(each){
			var each_margin = each.$el.data('margin'),
				each_margin_size = each.grid.top > cmp_bottom ? each.grid.top-cmp_bottom-1 : 0;
			if ( each_margin.current.top != each_margin_size ){
				each_margin.current.top = each_margin_size;
				if ( update_class )
					ed.update_margin_classes(each.$el);
				each.$el.data('margin', each_margin);
			}
		});
		this.time_end('fn adjust_els_bottom');
	},

	adjust_affected_bottom: function ( adj_wrap, adj_wrap_aff_bottom, ignore, cmp_bottom, update_class ) {
		this.time_start('fn adjust_affected_bottom');
		var	ed = Upfront.Behaviors.GridEditor,
			wrap_el_max = ed.get_wrap_el_max(adj_wrap, ignore, true),
			wrap_bottom = wrap_el_max ? ( cmp_bottom && cmp_bottom > wrap_el_max.grid.bottom ? cmp_bottom : wrap_el_max.grid.bottom ) : ( cmp_bottom ? cmp_bottom : adj_wrap.grid.bottom-1 );
		adj_wrap_aff_bottom = _.reject(adj_wrap_aff_bottom, function(el){
			return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false;
		});
		ed.adjust_els_bottom(adj_wrap_aff_bottom, wrap_bottom, update_class);
		this.time_end('fn adjust_affected_bottom');
	},

	/**
	 * Normalize elements and wrappers
	 */
	normalize: function (els, wraps) {
		this.time_start('fn normalize');
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			regions = app.layout.get("regions"),
			regions_need_update = [],
			groups_need_update = [],
			object_groups_need_update = [],
			models_need_move = [],
			is_responsive = ( breakpoint && !breakpoint['default'] );
		// Remove unneeded wraps from processing
		wraps = _.filter(wraps, function(wrap){
			return ( wrap.$el.is(':visible') || wrap.height > 0 );
		});
		// Iterate through elements and check if it must be contained in separate wrapper
		_.each(wraps, function(wrap){
			var $wrap_els= wrap.$el.find(ed.module_selector_direct + ', ' + ed.object_selector_direct),
				region = ed.get_region(wrap.$el.closest('.upfront-region')),
				$parent_group = wrap.$el.closest('.upfront-objects_container').length == 0 ? wrap.$el.closest('.upfront-module-group') : false,
				is_parent_group = ( $parent_group !== false && $parent_group.length > 0 ),
				group = is_parent_group ? ed.get_el($parent_group) : false,
				$object_group = !is_parent_group ? wrap.$el.closest('.upfront-object-group') : false,
				is_object = ( $object_group !== false && $object_group.length > 0 ),
				object_group = is_object ? ed.get_el($object_group) : false,
				wrap_index = !is_responsive ? wrap.$el.index('.upfront-wrapper') : wrap.$el.data('breakpoint_order'),
				wrap_cleared = false,
				wrap_top = false,
				wrap_left = false,
				insert_index = false
			;

			// Reset the column size if it's bigger than it allowed to
			$wrap_els.each(function(index){
				if ( this.offsetWidth <= 0 ) return; // Element is not visible
				var wrap_el = ed.get_el($(this)),
					col = ( !breakpoint || breakpoint['default'] ) ? ed.get_class_num(wrap_el.$el, ed.grid['class']) : wrap_el.$el.data('breakpoint_col')
				;
				if ( wrap_el.col < col && wrap_el.col > 0 ) {
					ed.update_model_margin_classes(wrap_el.$el, [ed.grid['class'] + wrap_el.col]);
				}
			});

			// Clear the wrapper when wrapper is rendered side-by-side, but the elements is not conflicting each other
			$wrap_els.each(function(index){
				var wrap_el = ed.get_el($(this)),
					aff_wraps = ed.get_affected_els(wrap_el, wraps, [], false),
					margin = wrap_el.$el.data('margin');
				if ( index == 0 && ( aff_wraps.left.length > 0 || aff_wraps.right.length > 0 ) ){
					var bottom_wrap = _.max(_.union(aff_wraps.left, aff_wraps.right), function(each){ return each.outer_grid.bottom; });
					if ( bottom_wrap.outer_grid.bottom < wrap_el.grid.top ){
						var model = ed.get_el_model(wrap_el.$el),
							collection = model.collection,
							model_index = collection.indexOf(model),
							last_wrap = _.max(_.union(aff_wraps.left, aff_wraps.right), function(each){ return each.outer_grid.left; }),
							last_wrap_index = !is_responsive ? last_wrap.$el.index('.upfront-wrapper') : last_wrap.$el.data('breakpoint_order'),
							last_wrap_el = _.last(ed.get_wrap_els(last_wrap)),
							last_model = ed.get_el_model(last_wrap_el.$el),
							last_index = collection.indexOf(last_model),
							margin_top = wrap_el.grid.top - bottom_wrap.outer_grid.bottom;

						wrap_top = wrap_el.grid.top - margin_top + 1;
						wrap_left = region.grid.left;
						wrap_cleared = true;
						wrap_el.outer_grid.top = wrap_top;
						// Check if we also need to move the position in model, or reorder in responsive
						if ( ( !is_responsive && last_index > model_index ) || ( is_responsive && last_wrap_index > wrap_index ) ) {
							if ( !is_responsive ){
								insert_index = last_index;
								wrap.$el.insertAfter(last_wrap.$el);
								models_need_move.push({collection: collection, model: model, index: insert_index});
							}
							else {
								var wrappers = is_parent_group ? ed.get_el_model($parent_group).get('wrappers') : regions.get_by_name(wrap_el.region).get('wrappers'),
									$wraps = wrap.$el.parent().find('> .upfront-wrapper').each(Upfront.Util.normalize_sort_elements_cb).sort(Upfront.Util.sort_elements_cb),
									shift = false;
								$wraps.each(function(i){
									var wrap_model = wrappers.get_by_wrapper_id($(this).attr('id'));
									if ( this == wrap.$el.get(0) ) {
										shift = true;
										wrap_model.set_breakpoint_property('order', last_wrap_index);
									}
									else {
										wrap_model.set_breakpoint_property('order', i-1);
										if ( this == last_wrap.$el.get(0) )
											shift = false;
									}
								});
							}
							/*if ( aff_wraps.right.length > 0 ) {
								var right_wrap = _.min(aff_wraps.right, function(each){ return each.outer_grid.left; }),
									right_wrap_els = ed.get_wrap_els(right_wrap);
								_.each(right_wrap_els, function(each){
									var each_margin = each.$el.data('margin');
									each_margin.current.left = each.grid.left-wrap_el.outer_grid.left;
									ed.update_model_margin_classes(each.$el);
								});
							}*/
						}
						if ( is_parent_group ){
							groups_need_update.push($parent_group);
						}
						else if ( is_object ) {
							object_groups_need_update.push($object_group);
						}
						else {
							regions_need_update.push(wrap_el.region);
						}
					}
				}
				else if ( wrap_cleared ){
					if ( !is_responsive && insert_index !== false ){
						var model = ed.get_el_model(wrap_el.$el),
							collection = model.collection
						;
						models_need_move.push({collection: collection, model: model, index: insert_index});
					}
				}
			});
			if ( wrap_cleared ) {
				wrap.outer_grid.top = wrap_top;
				wrap.grid.top = wrap_top;
				wrap.outer_grid.left = wrap_left;
				wrap.$el.data('clear', 'clear');
			}

			// Don't allow separating wrapper on responsive
			if ( is_responsive )
				return;

			// Separate wrapper if more than one element in the wrapper, provided that the wrapper is not conflicting anything
			if ( $wrap_els.size() > 1 ){
				$wrap_els.each(function(){
					var wrap_el = ed.get_el($(this)),
						aff_wraps = ed.get_affected_els(wrap, wraps, [], false);
					if ( aff_wraps.left.length == 0 && aff_wraps.right.length == 0 ){
						// Separate the wrapper
						var wrap_el_model = ed.get_el_model(wrap_el.$el),
							wrap_el_view = is_object ? Upfront.data.object_views[wrap_el_model.cid] : Upfront.data.module_views[wrap_el_model.cid],
							parent_view = is_parent_group && wrap_el_view.group_view
								? wrap_el_view.group_view
								: ( is_object && wrap_el_view.object_group_view ? wrap_el_view.object_group_view : wrap_el_view.region_view ),
							parent_el = is_parent_group && group
								? group
								: ( is_object && object_group ? object_group : region ),
							wrappers = parent_view.model.get('wrappers'),
							wrapper_id = Upfront.Util.get_unique_id("wrapper"),
							wrap_model = new Upfront.Models.Wrapper({
								"name": "",
								"properties": [
									{"name": "wrapper_id", "value": wrapper_id},
									{"name": "class", "value": ed.grid['class']+(wrap_el.grid.left+wrap_el.col-parent_el.grid.left)}
								]
							}),
							wrap_view = new Upfront.Views.Wrapper({model: wrap_model})
						;
						wrappers.add(wrap_model);
						wrap_model.add_class('clr');
						wrap_view.parent_view = wrap_el_view.parent_view;
						wrap_el_view.wrapper_view = wrap_view;
						wrap_view.render();
						wrap_el.$el.closest('.upfront-wrapper').before(wrap_view.$el);
						wrap_view.$el.append(wrap_el_view.$el);
						wrap_el_model.set_property('wrapper_id', wrapper_id);
						Upfront.data.wrapper_views[wrap_model.cid] = wrap_view;
						ed.init_margin(wrap_el);
						if ( is_parent_group ) {
							groups_need_update.push($parent_group);
						}
						else if ( is_object ){
							object_groups_need_update.push($object_group);
						}
						else {
							regions_need_update.push(wrap_el.region);
						}
					}
				});
			}
		});
		_.each(wraps, function(wrap){
			var region = ed.get_region(wrap.$el.closest('.upfront-region'));
			if ( !region )
				return;
			if ( !is_responsive && wrap.outer_grid.left == region.grid.left && !wrap.$el.hasClass('clr') )
				wrap.$el.addClass('clr');
		});
		_.each(_.uniq(regions_need_update), function(region){
			var region_model = regions.get_by_name(region),
				region_view = Upfront.data.region_views[region_model.cid];
			ed.update_wrappers(region_model, region_view.$el);
		});
		_.each(_.uniq(groups_need_update), function($group){
			var group_model = ed.get_el_model($group),
				group_view = Upfront.data.module_views[group_model.cid];
			ed.update_wrappers(group_model, group_view.$el);
		});
		_.each(_.uniq(object_groups_need_update), function($object_group){
			var object_model = ed.get_el_model($object_group),
				object_view = Upfront.data.object_views[object_model.cid];
			ed.update_wrappers(object_model, object_view.$el);
		});
		if ( !is_responsive ) {
			_.each(models_need_move, function(move){
				move.collection.remove(move.model, {silent: true});
				move.model.add_to(move.collection, move.index);
			});
		}
		// Clean clear data attribute
		_.each(wraps, function(wrap){
			wrap.$el.removeData('clear');
		});
		this.time_end('fn normalize');
	},

	/**
	 * Init the GridEditor object
	 */
	init: function(){
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			main_pos = $main.offset(),
			$layout = $main.find('.upfront-layout');
		ed.baseline = Upfront.Settings.LayoutEditor.Grid.baseline;
		ed.grid = Upfront.Settings.LayoutEditor.Grid;
		ed.col_size = ed.grid.column_width;

		ed.max_row = Math.floor(($(window).height()*0.5)/ed.baseline);
		ed.main = {
			$el: $main,
			top: main_pos.top,
			bottom: main_pos.top + $main.outerHeight(),
			left: main_pos.left,
			right: main_pos.left + $main.outerWidth()
		};

		// Prevents quick scroll when resizing
		var scrollStep = 15;
		$(document).on('scroll', function(e){
			if(ed.resizing === false || ed.resizing == window.scrollY)
				return;

			if(window.scrollY > ed.resizing)
				ed.resizing += scrollStep;
			else
				ed.resizing -= scrollStep;

			window.scrollTo(window.scrollX, ed.resizing);
		});
	},

	/**
	 * Start editor, to set all required variables
	 *
	 * @param {Object} view
	 */
	start: function(view, model, $cont){
		this.time_start('fn start');
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			main_pos = ed.main.$el.offset(),
			$layout = ed.main.$el.find('.upfront-layout'),
			layout_pos = $layout.offset(),
			is_object = view.$el.find(".upfront-editable_entity").eq(0).is(".upfront-object"),
			$containment = $cont || view.$el.closest(".upfront-editable_entities_container"),
			containment_pos = $containment.offset();
		// Set variables
		ed.col_size = ed.grid.column_width;
		ed.el_selector = is_object ? ed.object_selector : ed.module_selector;
		ed.el_selector_direct = is_object ? ed.object_selector_direct : ed.module_selector_direct;
		ed.main.top = main_pos.top;
		ed.main.bottom = main_pos.top + ed.main.$el.outerHeight();
		ed.main.left = main_pos.left;
		ed.main.right = main_pos.left + ed.main.$el.outerWidth();
		var grid_layout_left = layout_pos.left + ($layout.outerWidth() - (ed.grid.size*ed.col_size))/2;
		ed.grid_layout = {
			top: layout_pos.top,
			bottom: layout_pos.top + $layout.outerHeight(),
			left: grid_layout_left,
			right: grid_layout_left + (ed.grid.size*ed.col_size),
			layout_left: layout_pos.left,
			layout_right: layout_pos.left + $layout.outerWidth()
		};
		var containment_width = $containment.outerWidth(),
			containment_height = $containment.outerHeight(),
			containment_col = Math.round(containment_width/ed.col_size),
			containment_row = Math.round(containment_height/ed.baseline),
			containment_grid = ed.get_grid(containment_pos.left, containment_pos.top);
		ed.containment = {
			$el: $containment,
			top: containment_pos.top,
			bottom: containment_pos.top + containment_height,
			left: containment_pos.left,
			right: containment_pos.left + containment_width,
			col: containment_col,
			grid: {
				top: containment_grid.y,
				bottom: containment_grid.y+containment_row-1,
				left: containment_grid.x,
				right: containment_grid.x+containment_col-1
			}
		};
		ed.update_position_data($containment);
		this.time_end('fn start');
	},

	/**
	 * Update position data
	 */
	update_position_data: function ($containment, update_regions) {
		this.time_start('fn update_position_data');
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			$layout = ed.main.$el.find('.upfront-layout'),
			is_object = ( ed.el_selector == ed.object_selector ),
			$els = false,
			$wraps = $containment.find('> .upfront-wrapper'),
			$regions = $layout.find('.upfront-region').not('.upfront-region-locked'),
			$region = $containment.closest('.upfront-region'),
			region_name = $region.data('name'),
			$group = $containment.closest('.upfront-module-group'),
			group_id = $group.length > 0 ? $group.attr('id') : false
		;
		// If region isn't shadow, we ignore not-visible elements
		if ( region_name !== 'shadow' ) {
			$wraps = $wraps.filter(':visible');
			$els = $wraps.find(ed.el_selector_direct);
		}
		else {
			$els = $containment.find('> .upfront-module-view > .upfront-module');
		}
		ed.els = _.map($els, ed.get_position ); // Generate elements position data
		_.each(ed.els, function(el){
			el.region = region_name;
			el.group = group_id;
			ed.init_margin(el); // Generate margin data
		});
		ed.wraps = _.map($wraps, ed.get_position ); // Generate wrappers position data
		_.each(ed.wraps, function(wrap){
			wrap.region = region_name;
			wrap.group = group_id;
		});
		if ( false !== update_regions ) {
			ed.regions = _.map($regions, ed.get_region_position ); // Generate regions position data
			_.each(ed.regions, function(region){
				region.region = region.$el.closest('.upfront-region').data('name');
				region.group = false;
			});
		}
		this.time_end('fn update_position_data');
	},



	/**
	 * Update wrappers
	 */
	update_wrappers: function (parent_model, $parent) {
		if ( !parent_model ) return;
		this.time_start('fn update_wrappers');
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			is_object = ( ed.el_selector == ed.object_selector ),
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			wraps = parent_model.get('wrappers')
		;
		($parent ? $parent : $layout).find('.upfront-wrapper:visible').each(function(){
			var $wrap = $(this),
				wrap_id = $wrap.attr('ref-id') || $wrap.attr('id'),
				wrap_model = wraps.get_by_wrapper_id(wrap_id),
				clear = $wrap.data('clear'),
				children = _.map($wrap.find(ed.el_selector_direct), function (each) {
					var $el = $(each);
					if ( !$el || !$el.length ) return false;
					return $el;
				}).filter(function (each) {
					return each !== false;
				})
			;
			if ( children.length == 0 ){
				if ( wrap_model ) wraps.remove(wrap_model);
				return;
			}
			if ( $wrap.hasClass('upfront-wrapper-preview') ) return;
			if ( $wrap.height() <= 0 ) return;
			if ( ! wrap_model ) return;
			var current_col = ( !breakpoint || breakpoint['default'] ) ? ed.get_class_num($wrap, ed.grid['class']) : $wrap.data('breakpoint_col'),
				child_els = _.map(children, function($el){
					return {
						$el: $el,
						col: ( !breakpoint || breakpoint['default'] ) ? ed.get_class_num($el, ed.grid['class']) : $el.data('breakpoint_col')
					};
				}),
				max = _.max(child_els, function(each){
					if ( !each ) return;
					return each.col;
				}),
				wrap_col = max.col,
				wrap_breakpoint, breakpoint_data;
			ed.update_class($wrap, ed.grid['class'], wrap_col);
			if ( !breakpoint || breakpoint['default'] ){
				if ( current_col != wrap_col ) {
					wrap_model.replace_class(ed.grid['class']+wrap_col);
				}
				if ( (clear && clear == 'clear') || (!clear && $wrap.hasClass('clr')) ) {
					wrap_model.add_class('clr');
				}
				else {
					wrap_model.remove_class('clr');
				}
			}
			else {
				wrap_breakpoint = Upfront.Util.clone(wrap_model.get_property_value_by_name('breakpoint') || {});
				if ( !_.isObject(wrap_breakpoint[breakpoint.id]) ) {
					wrap_breakpoint[breakpoint.id] = {};
				}
				wrap_breakpoint[breakpoint.id].col = wrap_col;
				if ( clear ) {
					wrap_breakpoint[breakpoint.id].clear = (clear == 'clear');
				}
				wrap_model.set_property('breakpoint', wrap_breakpoint);
			}
			/*$wrap.stop().css({
				position: '',
				left: '',
				right: ''
			});*/
		});
		var wrapsToRemove = [];
		wraps.each(function(wrap){
			var wrapper_id = wrap.get_wrapper_id();
			if (
				($parent ? $parent : $layout).find('[ref-id='+wrapper_id+']').size() == 0
				&&
				($parent ? $parent : $layout).find('#'+wrapper_id).size() == 0
			) {
				wrapsToRemove.push(wrap);
			}
		});
		_.each(wrapsToRemove, function(wrap) {
			wraps.remove(wrap);
		});

		Upfront.Events.trigger("entity:wrappers:update", parent_model);
		this.time_end('fn update_wrappers');
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
			is_group = view.$el.hasClass('upfront-module-group'),
			is_object = view.$el.hasClass('upfront-object-view'),
			$me = is_group ? view.$el : view.$el.find('>.upfront-editable_entity'),
			is_parent_group = ( typeof view.group_view != 'undefined' ),
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			$resize, $resize_placeholder,
			axis
		;
		if (
				false === Upfront.plugins.isRequiredByPlugin('setup resizeable') &&
				model.get_property_value_by_name('disable_resize')
		) {
			return false;
		}
		if ( $me.hasClass('upfront-module-spacer') || $me.hasClass('upfront-object-spacer') ) {
			return false;
		}
		// If it's object, only allow resizable if it's from ObjectGroup, not from Module
		if ( is_object && typeof view.object_group_view == 'undefined' ) {
			return false;
		}
		if ( $me.data('ui-resizable') ){
			$me.resizable('option', 'disabled', false);
			return false;
		}
		//Prevent object resize if RESIZE is disabled
		if (!Upfront.Application.user_can_modify_layout()) {
			if ( $me.data('ui-resizable') ){
				$me.resizable('option', 'disabled', false);
			}

			return false;
		}
		//$me.append('<span class="upfront-icon-control upfront-icon-control-resize-nw upfront-resize-handle-nw ui-resizable-handle ui-resizable-nw"></span>');
		//$me.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se"></span>');
		$me.append('<span class="upfront-icon-control upfront-icon-control-resize-s upfront-resize-handle-s ui-resizable-handle ui-resizable-s"></span>');
		$me.resizable({
			containment: "document",
			autoHide: false,
			delay: 50,
			handles: {
				//nw: '.upfront-resize-handle-nw',
				//se: '.upfront-resize-handle-se',
				s: '.upfront-resize-handle-s'
			},
			start: function(e, ui){
				ed.start(view, model);

				// Prevents quick scroll when resizing
				ed.resizing = window.scrollY;

				var me = ed.get_el($me),
					margin = $me.data('margin'),
					data = $(this).data('ui-resizable');
				axis = data.axis ? data.axis : 'se';
				$resize_placeholder = $('<div class="upfront-resize-placeholder"></div>');
				$resize_placeholder.css({
					marginLeft: ((margin.original.left/(me.col+margin.original.left))*100) + '%',
					marginTop: margin.original.top*ed.baseline,
					width: ((me.col/(me.col+margin.original.left))*100) + '%',
					height: ui.originalSize.height
				});
				$resize = $('<div class="upfront-resize" style="height:'+me.height+'px;"></div>');
				$resize.css({
					height: me.height,
					width: me.width,
					minWidth: me.width,
					maxWidth: me.width,
					position: 'absolute'
				});
				if ( axis == 'nw' ) {
					$resize.css({
						top: me.position.top,
//						bottom: $('body').height() - me.position.bottom + ed.baseline,
						right: $('body').width() - me.position.right
					});
				}
				else
					$resize.css({
						top: me.position.top,
						left: me.position.left
					});
				$('body').append($resize);
				// Refreshing the elements position
				_.each(ed.els, function(each, index){
					ed.els[index] = ed.get_position(each.$el);
				});
				// Refreshing the wrapper position
				_.each(ed.wraps, function(each, index){
					ed.wraps[index] = ed.get_position(each.$el);
				});
				ed.normalize(ed.els, ed.wraps);
				ed.update_position_data(ed.containment.$el);
				// Clear margin and assign an absolute position, hack into the resizable instance as well
				var me_pos = $me.position(),
					rsz_pos = {
						left: me_pos.left + ( margin.original.left * ed.col_size ),
						top: me_pos.top + ( margin.original.top * ed.baseline )
					};
				$me.css({
					marginLeft: 0,
					marginTop: 0,
					position: 'absolute',
					left: rsz_pos.left,
					top: rsz_pos.top,
					minHeight: ''
				});
				data.originalPosition.left = rsz_pos.left;
				data.originalPosition.top = rsz_pos.top;
				data._updateCache({
					left: rsz_pos.left,
					top: rsz_pos.top
				});
				$resize_placeholder.insertBefore($me);

				view.trigger('entity:resize_start', {row: me.row, col: me.col, height: me.height, width: me.width, axis: axis}, view, view.model);
				Upfront.Events.trigger("entity:resize_start", view, view.model);
			},
			resize: function(e, ui){
				var $wrap = $me.closest('.upfront-wrapper'),
					$region = $me.closest('.upfront-region'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					region = ed.get_region($region),
					expand_lock = $region.hasClass('upfront-region-expand-lock'),
					col = me.col,
					aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
					move_limit = ed.get_move_limit(aff_els, ed.containment),
					max_col = col + ( axis == 'nw' ? me.grid.left-move_limit[0] : move_limit[1]-me.grid.right ),

					top_aff_el = aff_els.bottom.length ? _.min(aff_els.bottom, function(each){ return each.grid.top; }) : false,
					max_row = top_aff_el ? top_aff_el.grid.top-me.grid.top : region.grid.bottom-me.grid.top+1,

					current_col = Math.ceil(ui.size.width/ed.col_size),
					w = ( current_col > max_col ? Math.round(max_col*ed.col_size) : ui.size.width ),
					h = ( (ui.size.height > 15 ? ui.size.height : 0) || ui.originalSize.height ),
					current_row = Math.ceil(h/ed.baseline),
					rsz_col = ( current_col > max_col ? max_col : current_col ),
					rsz_row = ( expand_lock && current_row > max_row && max_row > 0 ? max_row : current_row )
				;
				if ( Math.abs($(window).height()-e.clientY) < 50 ){
					h += (ed.baseline*10);
					$(window).scrollTop( $(window).scrollTop()+(ed.baseline*10) );
				}
				$me.css({
					height: rsz_row*ed.baseline,
					width: w,
					minWidth: w,
					maxWidth: w
				});
				$me.data('resize-col', rsz_col);
				$me.data('resize-row', rsz_row);
				$resize.css({
					height: rsz_row*ed.baseline,
					width: rsz_col*ed.col_size,
					minWidth: rsz_col*ed.col_size,
					maxWidth: rsz_col*ed.col_size
				});
				if(axis == 'nw') {
					$resize.css({
						top: me.$el.find('>.upfront-resize-handle-nw').offset().top,
						marginTop: me.$el.find('>.upfront-resize-handle-se').offset().top+me.$el.find('>.upfront-resize-handle-se').height()-me.$el.find('>.upfront-resize-handle-nw').offset().top-rsz_row*ed.baseline
					});
				}
				if ( !expand_lock && axis != 'nw' )
					$resize_placeholder.css('height', rsz_row*ed.baseline);
				view.update_size_hint(rsz_col*ed.col_size, rsz_row*ed.baseline);

				view.trigger('entity:resizing', {row: rsz_row, col: rsz_col, height: rsz_row*ed.baseline, width: rsz_col*ed.col_size, axis: axis}, view, view.model);
			},
			stop: function(e, ui){
				Upfront.Events.trigger("entity:pre_resize_stop", view, view.model, ui);
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$wrap = $me.closest('.upfront-wrapper'),
					$region = $me.closest('.upfront-region'),
					me = ed.get_el($me),
					margin = $me.data('margin'),
					wrap = ed.get_wrap($wrap),
					expand_lock = $region.hasClass('upfront-region-expand-lock'),
					aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
					move_limit = ed.get_move_limit(aff_els, ed.containment),
					prev_col = Math.ceil(ui.originalSize.width/ed.col_size),
					prev_row = Math.ceil(ui.originalSize.height/ed.baseline),
					$post_data_object =  $me.find(".upost-data-object").length ? $me.find(".upost-data-object") : false,
					rsz_col = $me.data('resize-col'),
					rsz_row = parseFloat( $me.data('resize-row') ),

					regions = app.layout.get('regions'),
					region = regions.get_by_name($region.data('name')),
					$container = is_object ? ed.containment.$el : ( is_parent_group ? view.group_view.$el.find('.upfront-editable_entities_container:first') : $region.find('.upfront-modules_container > .upfront-editable_entities_container:first') ),
					module_selector = is_object ? ".upfront-wrapper > .upfront-object-view > .upfront-object" : ".upfront-wrapper > .upfront-module-view > .upfront-module, .upfront-wrapper > .upfront-module-group",
					model_breakpoint, breakpoint_data, padding_top_row, padding_bottom_row
				;

				// Prevents quick scroll when resizing
				ed.resizing = false;

				$resize_placeholder.remove();
				$resize.remove();

				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				$me.css({
					width: '',
					minWidth: '',
					maxWidth: '',
					height: '',
					position: '',
					top: '',
					left: '',
					marginLeft: '',
					marginTop: ''
				});

				if ( !breakpoint || breakpoint['default'] ){
					// Resize containing object first if it's only one object
					var objects = model.get('objects');
					if ( objects && objects.length == 1 ){
						objects.each(function(object){
							object.set_property('row', rsz_row );
						});
					}

					// Then resize the module
					model.set_property('row', rsz_row);
				}
				else {
					// Resize containing object first if it's only one object
					var objects = model.get('objects');
					if ( objects && objects.length == 1 ){
						objects.each(function(object){
							var obj_breakpoint = Upfront.Util.clone(object.get_property_value_by_name('breakpoint') || {});
							if ( !_.isObject(obj_breakpoint[breakpoint.id]) )
								obj_breakpoint[breakpoint.id] = {};
							obj_breakpoint[breakpoint.id].row = rsz_row;
							object.set_property('breakpoint', obj_breakpoint);
						});
					}

					// Then resize the module
					model_breakpoint = Upfront.Util.clone(model.get_property_value_by_name('breakpoint') || {});
					if ( !_.isObject(model_breakpoint[breakpoint.id]) )
						model_breakpoint[breakpoint.id] = {};
					breakpoint_data = model_breakpoint[breakpoint.id];
					breakpoint_data.edited = true;
					breakpoint_data.row = rsz_row;

					model.set_property('breakpoint', model_breakpoint);
				}

				/*if ( is_parent_group )
					ed.update_wrappers(view.group_view.model, view.group_view.$el);
				else if ( is_object )
					ed.update_wrappers(view.object_group_view.model, view.object_group_view.$el);
				else
					ed.update_wrappers(region, $region);*/

				// Let's normalize
				ed.update_position_data(ed.containment.$el);
				ed.normalize(ed.els, ed.wraps);

				$me.removeData('resize-col');
				$me.removeData('resize-row');

				view.trigger('entity:resize_stop', {row: rsz_row, col: rsz_col, height: rsz_row*ed.baseline, width: rsz_col*ed.col_size, axis: axis}, view, view.model);
				Upfront.Events.trigger("entity:resize_stop", view, view.model, ui);
				Upfront.Events.trigger("entity:resized", view, view.model);
			}
		});
	},

	toggle_resizables: function (enable) {
		$('.upfront-editable_entity.ui-resizable').resizable('option', 'disabled', (!enable));
	},

	/**
	 * Resize element
	 *
	 * @param (object) view
	 * @param (object) model
	 * @param (integer) col
	 * @param (integer) row
	 * @param (string) axis nw|se|all
	 * @param (bool) force
	 */
	resize: function (view, model, col, row, axis, force) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			axis = /all|nw|se/.test(axis) ? axis : 'all',
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout');

		ed.start(view, model);

		var $me = view.$el.find('.upfront-editable_entity:first'),
			$object = $me.find('.upfront-editable_entity'),
			$wrap = $me.closest('.upfront-wrapper'),
			$region = $me.closest('.upfront-region'),
			margin = $me.data('margin'),
			me = ed.get_el($me),
			wrap = ed.get_wrap($wrap),
			region = ed.get_region($region),
			expand_lock = $region.hasClass('upfront-region-expand-lock'),
			aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
			max = ed.get_max_size(me, ed.els, region, axis),
			is_parent_group = ( typeof view.group_view != 'undefined' ),
			group_model = is_parent_group ? view.group_view.model : false,
			regions = app.layout.get('regions'),
			region_model = regions.get_by_name($region.data('name')),
			wrappers = ( is_parent_group ? group_model : region_model ).get('wrappers'),
			wrap_model = wrappers.get_by_wrapper_id($wrap.attr('id')),
			wrap_view = Upfront.data.wrapper_views[wrap_model.cid]
		;

		if ( col < 1 || row < 1 )
			return false;

		if ( !force ){
			$me.css('min-height', '');
			$object.css('min-height', '');
			var min_row = Math.ceil($me.outerHeight()/ed.baseline);
			row = row > min_row ? row : min_row;
			$me.css('min-height', row*ed.baseline);
			$object.css('min-height', (row-2)*ed.baseline);
		}


		col = col ? ( col > max.col ? max.col : col ) : me.col;
		row = row ? ( max.row && row > max.row ? max.row : row ) : me.row;

		ed.normalize(ed.els, ed.wraps);
		ed.update_position_data(ed.containment.$el);
		ed.update_class($me, ed.grid['class'], col);
		model.set_property('row', row);
		// Also resize containing object if it's only one object
		var objects = model.get('objects');
		if ( objects && objects.length == 1 ){
			objects.each(function(object){
				object.set_property('row', row);
			});
		}
		// Update model value
		if ( axis != 'se' ){
			model.replace_class([
				ed.grid['class']+col
				//ed.grid.left_margin_class+margin.current.left,
				//ed.grid.top_margin_class+margin.current.top
			].join(' '));
		}
		else{
			model.replace_class(ed.grid['class']+col);
			//ed.update_model_margin_classes($layout.find('.upfront-module, .upfront-module-group').not($me));
		}
		if ( typeof view.group_view != 'undefined' ) {
			ed.update_wrappers(view.group_view.model, view.group_view.$el);
		}
		else {
			ed.update_wrappers(region_model, region.$el);
		}

		view.trigger('entity:resize_stop', {row: row, col: col}, view, view.model);
		Upfront.Events.trigger("entity:resized", view, view.model);
		return true;
	},




	/**
	 * Create resizable
	 *
	 * @param {Object} view
	 * @param {Object} model
	 */
	create_wrapper_resizable: function(view, model){
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$me = view.$el,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			$region,
			breakpoint,
			lines,
			is_object,
			is_group,
			container_view,
			container,
			has_group,
			also_has_group,
			$resize,
			$resize_placeholder,
			$also_resize,
			also_model,
			also_view,
			$spacer_feed,
			is_spacer,
			also_is_spacer,
			axis,
			min_col,
			also_min_col,
			max_col,
			child_els,
			also_child_els,
			first_in_row,
			last_in_row
		;
		if (
				false === Upfront.plugins.isRequiredByPlugin('setup resizeable') &&
				model.get_property_value_by_name('disable_resize')
		)
			return false;
		if ( $me.data('ui-resizable') ){
			$me.resizable('option', 'disabled', false);
			return false;
		}

		//Prevent object resize if RESIZE is disabled
		if (!Upfront.Application.user_can_modify_layout()) {
			if ( $me.data('ui-resizable') ){
				$me.resizable('option', 'disabled', false);
			}

			//Remove the handlers
			$me.find('.upfront-resize-handle-wrapper').remove();

			return false;
		}
		//$me.append('<span class="upfront-resize-handle-wrapper upfront-resize-handle-w ui-resizable-handle ui-resizable-w">');
		//$me.append('<span class="upfront-resize-handle-wrapper upfront-resize-handle-e ui-resizable-handle ui-resizable-e">');
		$me.resizable({
			containment: "document",
			autoHide: false,
			delay: 50,
			handles: {
				w: '.upfront-resize-handle-wrapper-w',
				e: '.upfront-resize-handle-wrapper-e'
			},
			start: function(e, ui){
				ed.time_start('fn wrapper_resize_start');
				ed.start(view, model);

				// Prevents quick scroll when resizing
				ed.resizing = window.scrollY;
				breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON();
				is_object = !_.isUndefined(view.parent_view.object_group_view);
				if ( is_object ) {
					container_view = view.parent_view.object_group_view;
					container = ed.get_position(container_view.$el);
				}
				else {
					is_group = !_.isUndefined(view.parent_view.group_view);
					container_view = is_group ? view.parent_view.group_view : view.parent_view.region_view;
					container = is_group ? ed.get_position(container_view.$el) : ed.get_region(container_view.$el);
				}

				var me = ed.get_wrap($me),
					//margin = $me.data('margin'),
					data = $(this).data('ui-resizable'),
					$wrappers = Upfront.Util.find_sorted($me.parent(), '> .upfront-wrapper'),
					aff_els = ed.get_affected_els(me, ed.wraps, [], true),
					wrappers = container_view.model.get('wrappers'),
					modules = is_object ? container_view.model.get('objects') : container_view.model.get('modules'),
					lines = ed.parse_modules_to_lines(modules, wrappers, breakpoint.id, container.col),
					also_resize
				;

				$region = $me.closest('.upfront-region');
				axis = data.axis ? data.axis : 'e';
				$also_resize = false;
				also_resize = false;
				also_model = false;
				also_view = false;
				also_is_spacer = false;
				has_group = ( $me.find('> .upfront-module-group').length > 0 );
				max_col = me.col;
				min_col = ed.min_col;
				also_min_col = ed.min_col;

				_.each(lines, function(line){
					_.each(line.wrappers, function (w, wi) {
						var also_w = false;
						if ( w.model != model ) return;
						first_in_row = ( wi === 0 );
						last_in_row = ( wi === line.wrappers.length - 1 );
						is_spacer = w.spacer;
						if ( !first_in_row && axis == 'w' ) {
							also_w = line.wrappers[wi-1];
						}
						else if ( !last_in_row && axis == 'e' ) {
							also_w = line.wrappers[wi+1];
						}
						if ( also_w !== false ) {
							also_model = also_w.model;
							also_view = Upfront.data.wrapper_views[also_model.cid];
							$also_resize = also_view.$el;
							also_resize = ed.get_wrap($also_resize);
							also_is_spacer = also_w.spacer;
						}
					});
				});


				child_els = [];
				$me.find(ed.el_selector_direct).each(function () {
					var child_model = ed.get_el_model($(this)),
						child_view = is_object ? Upfront.data.object_views[child_model.cid] : Upfront.data.module_views[child_model.cid]
					;
					if ( !child_view ) return;
					child_els.push({
						view: child_view,
						is_group: !is_object ? $(this).hasClass('upfront-module-group') : false,
						el: ed.get_el($(this))
					});
				});
				if ( has_group ) {
					_.each(child_els, function (child) {
						if ( !child.is_group ) return;
						var child_min_col = ed.get_group_min_col(child.view);
						min_col = child_min_col > min_col ? child_min_col : min_col;
					});
				}

				$resize = $('<div class="upfront-resize" style="height:'+me.height+'px;"></div>');
				$resize.css({
					height: me.height,
					width: me.width,
					minWidth: me.width,
					maxWidth: me.width,
					position: 'absolute'
				});
				if ( axis == 'w' ) {
					$resize.css({
						top: me.position.top,
						right: $('body').width() - me.position.right
					});
				}
				else {
					$resize.css({
						top: me.position.top,
						left: me.position.left
					});
				}
				$('body').append($resize);
				also_child_els = [];
				if ( $also_resize && $also_resize.length ) {
					also_has_group = ( $also_resize.find('> .upfront-module-group').length > 0 );

					$also_resize.find(ed.el_selector_direct).each(function () {
						var child_model = ed.get_el_model($(this)),
							child_view = is_object ? Upfront.data.object_views[child_model.cid] : Upfront.data.module_views[child_model.cid]
						;
						if ( !child_view ) return;
						also_child_els.push({
							view: child_view,
							is_group: !is_object ? $(this).hasClass('upfront-module-group') : false,
							el: ed.get_el($(this))
						});
					});
					if ( also_has_group ) {
						_.each(also_child_els, function (child) {
							if ( !child.is_group ) return;
							var child_min_col = ed.get_group_min_col(child.view);
							also_min_col = child_min_col > also_min_col ? child_min_col : also_min_col;
						});
					}

					max_col = me.col + also_resize.col;
					if ( !is_spacer && !also_is_spacer ) {
						max_col -= also_min_col;
					}
					else if ( is_spacer ) {
						max_col -= also_min_col;
						min_col = 0;
					}
					if ( also_is_spacer ) {
						also_min_col = 0;
					}
				}

				$resize_placeholder = $('<div class="upfront-resize-placeholder"></div>');
				$resize_placeholder.css({
					width: (((also_resize ? also_resize.col + me.col : me.col)/container.col)*100) + '%',
					height: ui.originalSize.height,
					position: 'relative'
				});
				if ( breakpoint && !breakpoint['default'] ) {
					$resize_placeholder.css('order', $me.css('order'));
				}
				if ( is_spacer || also_is_spacer ) {
					$spacer_feed = $('<div class="upfront-spacer-feed"></div>');
					$spacer_feed.css({
						width: ed.col_size,
						height: 'auto',
						top: 0,
						bottom: 0,
						position: 'absolute'
					});
					$resize_placeholder.append($spacer_feed);
				}
				// Refreshing the elements position
				_.each(ed.els, function(each, index){
					ed.els[index] = ed.get_position(each.$el);
				});
				// Refreshing the wrapper position
				_.each(ed.wraps, function(each, index){
					ed.wraps[index] = ed.get_position(each.$el);
				});
				ed.normalize(ed.els, ed.wraps);
				ed.update_position_data(ed.containment.$el);
				// Clear margin and assign an absolute position, hack into the resizable instance as well
				var me_pos = $me.position(),
					also_resize_pos = ( $also_resize ? $also_resize.position() : false );
				$me.css({
					marginLeft: 0,
					marginTop: 0,
					position: 'absolute',
					left: me_pos.left,
					top: me_pos.top,
					minHeight: ''
				});
				if ( $also_resize ) {
					$also_resize.css({
						marginLeft: 0,
						marginTop: 0,
						position: 'absolute',
						top: also_resize_pos.top,
						left: also_resize_pos.left
					});
				}
				data.originalPosition.left = me_pos.left;
				data.originalPosition.top = me_pos.top;
				data._updateCache({
					left: me_pos.left,
					top: me_pos.top
				});
				$resize_placeholder.insertBefore($me);

				// Trigger child events
				_.each(child_els, function (child) {
					child.view.trigger('entity:resize_start', {row: child.el.row, col: child.el.col, height: child.el.height, width: child.el.width, axis: axis}, child.view, child.view.model);
				});
				_.each(also_child_els, function (child) {
					child.view.trigger('entity:resize_start', {row: child.el.row, col: child.el.col, height: child.el.height, width: child.el.width, axis: ( axis == 'w' ? 'e' : 'w' )}, child.view, child.view.model);
				});

				// Trigger main event
				view.trigger('entity:wrapper:resize_start', {row: me.row, col: me.col, height: me.height, width: me.width, axis: axis}, view, view.model);
				if ( also_view ) {
					also_view.trigger('entity:wrapper:resize_start', {row: also_resize.row, col: also_resize.col, height: also_resize.height, width: also_resize.width, axis: ( axis == 'w' ? 'e' : 'w' )}, also_view, also_view.model);
				}
				Upfront.Events.trigger("entity:wrapper:resize_start", view, view.model, also_view, also_view.model);

				ed.time_end('fn wrapper_resize_start');
			},
			resize: function(e, ui){
				ed.time_start('fn wrapper_resize_resizing');
				var me = ed.get_wrap($me),
					also_resize = ( $also_resize ? ed.get_wrap($also_resize) : false ),
					region = ed.get_region($region),
					min_w = min_col*ed.col_size,
					w = ( current_col > max_col ? Math.round(max_col*ed.col_size) : ( min_w > ui.size.width ? min_w : ui.size.width ) ),
					current_col = Math.round(w/ed.col_size),
					h = ( (ui.size.height > 15 ? ui.size.height : 0) || ui.originalSize.height ),
					l = ( axis == 'w' ? ui.originalPosition.left+ui.originalSize.width-w : ui.position.left ),
					rsz_col = ( current_col > max_col ? max_col : current_col ),
					also_col = max_col - rsz_col + also_min_col,
					also_w = ( ( max_col + also_min_col ) * ed.col_size ) - w
				;
				$me.css({
					left: l,
					height: h,
					width: w,
					minWidth: w,
					maxWidth: w
				});
				$me.data('resize-col', rsz_col);
				// Visual feedback for deleting spacer
				if ( is_spacer && w < ed.col_size ) {
					var opacity = 0.5 * Math.round((ed.col_size-w)/ed.col_size*100)/100;
					$spacer_feed.css({
						left: ( axis == 'e' ? 0 : 'auto' ),
						right: ( axis == 'e' ? 'auto' : 0 ),
						backgroundColor: 'rgba(200, 0, 0, ' + opacity + ')'
					});
				}
				if ( $also_resize ) {
					$also_resize.css({
						width: also_w,
						minWidth: also_w,
						maxWidth: also_w
					});
					if ( axis == 'e' ) {
						$also_resize.css('margin-left', also_resize.width - also_w);
					}
					$also_resize.data('resize-col', also_col);
					// Visual feedback for deleting spacer
					if ( also_is_spacer && also_w < ed.col_size ) {
						var opacity = 0.5 * Math.round((ed.col_size-also_w)/ed.col_size*100)/100;
						$spacer_feed.css({
							left: ( axis == 'w' ? 0 : 'auto' ),
							right: ( axis == 'w' ? 'auto' : 0 ),
							backgroundColor: 'rgba(200, 0, 0, ' + opacity + ')'
						});
					}
				}
				$resize.css({
					height: h,
					width: rsz_col*ed.col_size,
					minWidth: rsz_col*ed.col_size,
					maxWidth: rsz_col*ed.col_size
				});

				// Trigger child events
				_.each(child_els, function (child) {
					child.view.trigger('entity:resizing', {row: child.el.row, col: rsz_col, height: child.el.height, width: rsz_col*ed.col_size, axis: axis}, child.view, child.view.model);
				});
				_.each(also_child_els, function (child) {
					child.view.trigger('entity:resizing', {row: child.el.row, col: also_col, height: child.el.height, width: also_col*ed.col_size, axis: ( axis == 'w' ? 'e' : 'w' )}, child.view, child.view.model);
				});

				// Trigger main event
				view.trigger('entity:wrapper:resizing', {row: me.row, col: rsz_col, height: me.height, width: rsz_col*ed.col_size, axis: axis}, view, view.model);
				if ( also_view ) {
					also_view.trigger('entity:wrapper:resizing', {row: also_resize.row, col: also_col, height: also_resize.height, width: also_col*ed.col_size, axis: ( axis == 'w' ? 'e' : 'w' )}, also_view, also_view.model);
				}
				ed.time_end('fn wrapper_resize_resizing');
			},
			stop: function(e, ui){
				ed.time_start('fn wrapper_resize_stop');
				Upfront.Events.trigger("entity:wrapper:pre_resize_stop", view, view.model, ui);
				var me = ed.get_wrap($me),
					also_resize = ( $also_resize ? ed.get_wrap($also_resize) : false ),
					prev_col = Math.ceil(ui.originalSize.width/ed.col_size),
					rsz_col = $me.data('resize-col'),
					also_col = ( $also_resize ? $also_resize.data('resize-col') : 0 ),
					regions = app.layout.get('regions'),
					region = regions.get_by_name($region.data('name')),
					first_in_row_w = ( axis == 'w' && first_in_row ),
					last_in_row_e = ( axis == 'e' && last_in_row )
				;

				// Prevents quick scroll when resizing
				ed.resizing = false;

				$resize_placeholder.remove();
				$resize.remove();

				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				$me.css({
					width: '',
					minWidth: '',
					maxWidth: '',
					height: '',
					position: '',
					top: '',
					left: '',
					marginLeft: '',
					marginTop: ''
				});
				if ( $also_resize ) {
					$also_resize.css({
						width: '',
						minWidth: '',
						maxWidth: '',
						height: '',
						position: '',
						top: '',
						left: '',
						marginLeft: '',
						marginTop: ''
					});
				}

				// If this is placed on the side, let's add spacer
				if ( !also_model && ( first_in_row_w || last_in_row_e ) && max_col-rsz_col > 0 ) {
					view.add_spacer( ( first_in_row_w ? 'left' : 'right' ), max_col-rsz_col, max_col, is_object );
				}
				else {
					// Else if rsz_col is 0, remove model, otherwise update model
					if ( rsz_col > 0 ) {
						if ( breakpoint && !breakpoint['default'] ) {
							model.set_breakpoint_property('edited', true, true);
							model.set_breakpoint_property('col', rsz_col);
							_.each(child_els, function (child) {
								child.view.model.set_breakpoint_property('edited', true, true);
								child.view.model.set_breakpoint_property('col', rsz_col);
							});
						}
						else {
							model.replace_class(ed.grid['class']+rsz_col);
							_.each(child_els, function (child) {
								child.view.model.replace_class(ed.grid['class']+rsz_col);
							});
						}
					}
					else if ( is_spacer ) {
						model.collection.remove(model);
						_.each(child_els, function (child) {
							child.view.model.collection.remove(child.view.model);
						});
					}
					if ( also_model ) {
						// Do the same if also_col is 0, remove model, otherwise update model
						if ( also_col > 0 ) {
							if ( breakpoint && !breakpoint['default'] ) {
								also_model.set_breakpoint_property('edited', true, true);
								also_model.set_breakpoint_property('col', also_col);
								_.each(also_child_els, function (child) {
									child.view.model.set_breakpoint_property('edited', true, true);
									child.view.model.set_breakpoint_property('col', also_col);
								});
							}
							else {
								also_model.replace_class(ed.grid['class']+also_col);
								_.each(also_child_els, function (child) {
									child.view.model.replace_class(ed.grid['class']+also_col);
								});
							}
						}
						else if ( also_is_spacer ) {
							also_model.collection.remove(also_model);
							_.each(also_child_els, function (child) {
								child.view.model.collection.remove(child.view.model);
							});
						}
					}
				}

				// Make sure everything has breakpoint property edited true in this region now that element is resized
				if ( is_object ) {
					container_view.model.get('objects').each(function (each) {
						each.set_breakpoint_property('edited', true, true);
					});
				}
				else {
					container_view.model.get('modules').each(function (each) {
						each.set_breakpoint_property('edited', true, true);
					});
				}
				container_view.model.get('wrappers').each(function (each) {
					each.set_breakpoint_property('edited', true, true);
				});

				// Let's normalize
				ed.update_position_data(ed.containment.$el);
				ed.normalize(ed.els, ed.wraps);

				$me.removeData('resize-col');
				if ( $also_resize ) {
					$also_resize.removeData('resize-col');
				}

				// Trigger child events
				_.each(child_els, function (child) {
					child.view.trigger('entity:resize_stop', {row: child.el.row, col: rsz_col, height: child.el.height, width: rsz_col*ed.col_size, axis: axis}, child.view, child.view.model);
				});
				_.each(also_child_els, function (child) {
					child.view.trigger('entity:resize_stop', {row: child.el.row, col: also_col, height: child.el.height, width: also_col*ed.col_size, axis: ( axis == 'w' ? 'e' : 'w' )}, child.view, child.view.model);
				});

				// Trigger main event
				view.trigger('entity:wrapper:resize_stop', {row: me.row, col: rsz_col, height: me.height, width: rsz_col*ed.col_size, axis: axis}, view, view.model);
				view.trigger('entity:wrapper:resize', {col: rsz_col}, view, view.model);
				if ( also_view ) {
					also_view.trigger('entity:wrapper:resize_stop', {row: also_resize.row, col: also_col, height: also_resize.height, width: rsz_col*ed.col_size, axis: ( axis == 'w' ? 'e' : 'w' )}, also_view, also_view.model);
					also_view.trigger('entity:wrapper:resize', {col: also_col}, also_view, also_view.model);
				}
				Upfront.Events.trigger("entity:wrapper:resize_stop", view, view.model, also_view, also_view.model, ui);
				Upfront.Events.trigger("entity:wrapper:resized", view, view.model, also_view, also_view.model);

				ed.time_end('fn wrapper_resize_stop');
			}
		});
	},

	get_group_min_col: function (group_view) {
		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			ed = Upfront.Behaviors.GridEditor,
			modules = group_view.model.get('modules'),
			wrappers = group_view.model.get('wrappers'),
			col = ( !breakpoint || breakpoint['default'] ) ? ed.get_class_num(group_view.$el, ed.grid['class']) : group_view.$el.data('breakpoint_col'),
			lines = ed.parse_modules_to_lines(modules, wrappers, ( breakpoint ? breakpoint.id : 'desktop' ), col),
			min_col = ed.min_col
		;
		_.each(lines, function (line) {
			var line_min_col = 0;
			_.each(line.wrappers, function (w) {
				if (w.spacer ) line_min_col += 1; // Spacer minimum column is 1
				else line_min_col += ed.min_col; // Element minimum column depend to ed.min_col
			});
			if ( line_min_col > min_col ) min_col = line_min_col;
		});
		return min_col;
	},

	/**
	 * Create draggable
	 *
	 * @param {Object} view
	 * @param {Object} model
	 */
	create_draggable: function (view, model) {
		var ed = Upfront.Behaviors.GridEditor;
		if ( ed.drag_instances[view.cid] ) {
			// Instance already there, run setup again
			ed.drag_instances[view.cid].setup();
		}
		else {
			// Create new instance
			ed.drag_instances[view.cid] = new DragDrop(view, model);
			model.on('remove', function(){
				delete ed.drag_instances[view.cid];
			});
		}
	},

	toggle_draggables: function (enable) {
		$('.upfront-editable_entity.ui-draggable').draggable('option', 'disabled', (!enable));
	},

	/**
	 * Parse modules collection into the correct order by breakpoint
	 */
	parse_modules_to_lines: function (modules, wrappers, breakpoint_id, col) {
		var ed = Upfront.Behaviors.GridEditor,
			all_wrappers = {},
			sorted_wrappers = [],
			lines = [],
			line_col = 0,
			line = 0
		;
		modules.each(function(module, i){
			var wrapper_id = module.get_wrapper_id(),
				wrapper = wrappers.get_by_wrapper_id(wrapper_id),
				wrapper_breakpoint = wrapper ? wrapper.get_property_value_by_name('breakpoint') : false,
				wrapper_breakpoint_data = ( wrapper_breakpoint && breakpoint_id in wrapper_breakpoint ) ? wrapper_breakpoint[breakpoint_id] : {},
				wrapper_class = wrapper ? wrapper.get_property_value_by_name('class') : '',
				wrapper_col = ed.get_class_num(wrapper_class, ed.grid['class']),
				is_clear = !!wrapper_class.match(/clr/),
				breakpoint = module.get_property_value_by_name('breakpoint'),
				breakpoint_data = ( breakpoint && breakpoint_id in breakpoint ) ? breakpoint[breakpoint_id] : {},
				default_hide = module.get_property_value_by_name('default_hide'),
				hide = module.get_property_value_by_name('hide'),
				module_class = module.get_property_value_by_name('class'),
				module_col = ed.get_class_num(module_class, ed.grid['class']),
				is_spacer = !!module_class.match(/(upfront-module-spacer|upfront-object-spacer)/),
				order = i,
				wrapper_order = i,
				module_obj = {}
			;
			if ( !wrapper ) return;
			if ( breakpoint_id != 'desktop' ) {
				hide = ( "hide" in breakpoint_data ) ? breakpoint_data.hide : default_hide;
				module_col = ( "col" in breakpoint_data ) ? parseInt(breakpoint_data.col, 10) : module_col;
				order = ( "order" in breakpoint_data ) ? parseInt(breakpoint_data.order, 10) * 10000 + order : order;
				wrapper_col = ( "col" in wrapper_breakpoint_data ) ? parseInt(wrapper_breakpoint_data.col, 10) : wrapper_col;
				wrapper_order = ( "order" in wrapper_breakpoint_data ) ? parseInt(wrapper_breakpoint_data.order, 10) * 10000 + wrapper_order : wrapper_order;
				is_clear = ( "clear" in wrapper_breakpoint_data ) ? wrapper_breakpoint_data.clear : is_clear;
			}
			if ( hide === false ) hide = default_hide;
			if ( hide && is_spacer ) return;
			module_obj = {
				model: module,
				col: module_col,
				order: order,
				spacer: is_spacer,
				hide: hide
			};
			if ( module_col > wrapper_col ) wrapper_col = module_col;
			if ( wrapper_col > col ) wrapper_col = col;
			if ( wrapper_id in all_wrappers ) {
				all_wrappers[wrapper_id].modules.push(module_obj);
				all_wrappers[wrapper_id].col = wrapper_col;
			}
			else {
				all_wrappers[wrapper_id] = {
					model: wrapper,
					modules: [module_obj],
					order: wrapper_order,
					col: wrapper_col,
					clear: is_clear,
					spacer: is_spacer
				};
			}
		});
		sorted_wrappers = _.sortBy(all_wrappers, function(wrapper, i){
			return wrapper.order;
		});
		_.each(sorted_wrappers, function(wrapper, i){
			if ( ( i > 0 && wrapper.clear ) || ( line_col > 0 && line_col + wrapper.col > col ) ) { // this is new line
				lines[line].col = line_col;
				line++;
				line_col = 0;
			}
			if ( _.isUndefined(lines[line]) ) {
				lines[line] = {
					wrappers: [],
					col: 0
				};
			}
			line_col += wrapper.col;
			lines[line].wrappers.push(wrapper);
			lines[line].col = line_col;
		});
		return lines;
	},

	get_container_col: function (view, breakpoint) {
		var ed = Upfront.Behaviors.GridEditor,
			is_group = !_.isUndefined(view.group_view),
			is_object = !_.isUndefined(view.object_group_view),
			container_breakpoint = ( is_group ? view.group_view : ( is_object ? view.object_group_view.parent_module_view : view.region_view ) ).model.get_property_value_by_name('breakpoint'),
			container_breakpoint_data = ( container_breakpoint && breakpoint.id in container_breakpoint ) ? container_breakpoint[breakpoint.id] : {},
			$container = is_object
				? view.object_group_view.parent_module_view.$el.find('> .upfront-module')
				: ( is_group ? view.group_view : view.region_view ).$el,
			container_col = breakpoint['default']
				? ed.get_class_num($container, ed.grid['class'])
				: ( _.isNumber(container_breakpoint_data.col) ? container_breakpoint_data.col : breakpoint.columns )
		;
		return container_col > breakpoint.columns ? breakpoint.columns : container_col;
	},

	/**
	 * Call this to normalize module placement on remove
	 */
	normalize_module_remove: function (view, module, modules, wrapper, wrappers) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			index = modules.indexOf(module),
			breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled(),
			is_group = !_.isUndefined(view.group_view),
			is_object = !_.isUndefined(view.object_group_view)
		;
		_.each(breakpoints, function(each){
			var breakpoint = each.toJSON(),
				container_col = ed.get_container_col(view, breakpoint),
				lines = ed.parse_modules_to_lines(modules, wrappers, breakpoint.id, container_col),
				split_prev = false,
				split_next = false,
				all_wrappers = [],
				spacer_wrappers = [],
				line, my_wrapper, prev_wrapper, next_wrapper,
				prev_wrapper_class, next_wrapper_class
			;
			_.each(lines, function (each) {
				if ( line ) return;
				prev_wrapper = false;
				next_wrapper = false;
				_.each(each.wrappers, function (w) {
					if ( my_wrapper && !next_wrapper ) next_wrapper = w;
					_.each(w.modules, function (m) {
						if ( module == m.model ) {
							my_wrapper = w;
							line = each;
						}
					});
					if ( !my_wrapper ) prev_wrapper = w;
				});
			});
			if ( !line ) return;
			if ( next_wrapper ) {
				next_wrapper_class = next_wrapper.model.get_property_value_by_name('class');
				if ( !next_wrapper_class.match(/clr/g) ){
					split_next = true;
				}
			}
			if ( prev_wrapper ) {
				prev_wrapper_class = prev_wrapper.model.get_property_value_by_name('class');
				if ( prev_wrapper_class.match(/clr/g) && !split_next ) {
					split_prev = true;
				}
			}
			_.each(line.wrappers, function (w) {
				if ( w == my_wrapper ) return;
				all_wrappers.push(w);
				if ( w.spacer ) spacer_wrappers.push(w);
			});
			if ( all_wrappers.length >= 2 ) {
				split_next = false;
			}

			if ( my_wrapper.modules.length == 1 ) {
				var total_col = container_col,
					new_col = 0,
					remaining_col = 0
				;
				_.each(spacer_wrappers, function (each_wrapper) {
					total_col -= each_wrapper.col;
				});
				if ( all_wrappers.length == spacer_wrappers.length ) {
					// All wrappers is spacers, just remove them as we don't need it anymore
					_.each(all_wrappers, function (each_wrapper, id) {
						_.each(each_wrapper.modules, function (each_module) {
							modules.remove(each_module.model);
						});
						wrappers.remove(each_wrapper.model);
					});
				}
				else {
					// Otherwise split columns evenly and ignore spacer columns
					new_col = Math.floor(total_col/(all_wrappers.length-spacer_wrappers.length));
					remaining_col = total_col - ((all_wrappers.length-spacer_wrappers.length) * new_col);
					// Apply the new col
					_.each(all_wrappers, function (each_wrapper, id) {
						if ( _.contains(spacer_wrappers, each_wrapper) ) return;
						var each_wrapper_class = each_wrapper.model.get_property_value_by_name('class'),
							each_wrapper_breakpoint = each_wrapper.model.get_property_value_by_name('breakpoint'),
							each_wrapper_breakpoint_data = ( each_wrapper_breakpoint && breakpoint.id in each_wrapper_breakpoint ) ? each_wrapper_breakpoint[breakpoint.id] : {},
							apply_col =  new_col
						;
						// Distribute remaining_col
						if ( remaining_col > 0 ) {
							apply_col += 1;
							remaining_col -= 1;
						}
						if ( breakpoint['default'] ) {
							each_wrapper.model.replace_class(
								ed.grid['class'] + apply_col +
								( id == 0 && !each_wrapper_class.match(/clr/g) ? ' clr' : '' )
							);
							_.each(each_wrapper.modules, function (each_module) {
								each_module.model.replace_class(ed.grid['class'] + apply_col);
							});
						}
						else {
							each_wrapper_breakpoint_data.col = apply_col;
							if ( id == 0 && !each_wrapper_breakpoint_data.clear ) {
								each_wrapper_breakpoint_data.clear = true;
							}
							each_wrapper.model.set_property('breakpoint', Upfront.Util.clone(each_wrapper_breakpoint));
							_.each(each_wrapper.modules, function (each_module) {
								var each_module_breakpoint = each_module.model.get_property_value_by_name('breakpoint'),
									each_module_breakpoint_data = ( each_module_breakpoint && breakpoint.id in each_module_breakpoint ) ? each_module_breakpoint[breakpoint.id] : {}
								;
								each_module_breakpoint_data.col = apply_col;
								each_module.model.set_property('breakpoint', Upfront.Util.clone(each_module_breakpoint));
							});
						}
					});
				}
			}
			if ( !breakpoint['default'] ) return;
			if ( split_prev || split_next ){
				var current_wrapper = false;
				_.each(( split_prev ? prev_wrapper.modules : next_wrapper.modules ), function (each_module, id) {
					var each_module_class = each_module.model.get_property_value_by_name('class'),
						each_module_col = ed.get_class_num(each_module_class, ed.grid['class']),
						each_module_view = Upfront.data.module_views[each_module.model.cid],
						each_wrapper = split_prev ? prev_wrapper : next_wrapper,
						each_wrapper_view = Upfront.data.wrapper_views[each_wrapper.model.cid],
						current_wrapper_view = current_wrapper ? Upfront.data.wrapper_views[current_wrapper.cid] : each_wrapper_view
					;
					if ( id > 0 ){
						var wrapper_id = Upfront.Util.get_unique_id("wrapper"),
							wrap_model = new Upfront.Models.Wrapper({
								"name": "",
								"properties": [
									{"name": "wrapper_id", "value": wrapper_id},
									{"name": "class", "value": ed.grid['class']+(each_module_col) + ' clr'}
								]
							}),
							wrap_view = new Upfront.Views.Wrapper({model: wrap_model})
						;
						wrappers.add(wrap_model);
						wrap_view.parent_view = each_module_view.parent_view;
						each_module_view.wrapper_view = wrap_view;
						wrap_view.render();
						wrap_view.$el.append(each_module_view.$el);
						current_wrapper_view.$el.after(wrap_view.$el);
						Upfront.data.wrapper_views[wrap_model.cid] = wrap_view;
						each_module.model.set_property('wrapper_id', wrapper_id);
						current_wrapper = wrap_model;
					}
				});
			}
		});
	},

	/**
	 * Call this to adapt module to the breakpoint
	 */
	adapt_to_breakpoint: function (modules, wrappers, breakpoint_id, parent_col, silent) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().findWhere({id: breakpoint_id}).toJSON(),
			desktop_breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default().toJSON(),
			silent = ( silent === true ) ? true : false,
			desktop_lines = ed.parse_modules_to_lines(modules, wrappers, desktop_breakpoint.id, desktop_breakpoint.columns),
			lines = ed.parse_modules_to_lines(modules, wrappers, breakpoint_id, parent_col),
			filtered_lines = ed._filter_edited_lines(lines, breakpoint),
			adapt_wrappers = [],
			adapt_wrappers_top = [],
			adapt_wrappers_bottom = [],
			adapt_lines = [],
			adapt_lines_insert = [],
			adapt_lines_top = [],
			adapt_lines_bottom = [],
			adapt_col = 0
		;
		ed._wrapper_index = 0;
		// First let's find wrappers that we need to adapt from desktop layout
		_.each(desktop_lines, function (line, l) {
			_.each(line.wrappers, function (wrapper, w) {
				if ( wrapper.spacer ) return; // Ignore spacers
				var is_edited = wrapper.model.get_breakpoint_property_value('edited', false, false, breakpoint);
				if ( is_edited ) {
					ed._wrapper_index++;
					return;
				}
				ed._wrapper_index++;
				// Find prev and next wrapper for reference later when deciding the final order
				adapt_wrappers.push({
					prev: ed._find_prev_wrapper_from_lines(wrapper, w, line, l, desktop_lines),
					next: ed._find_next_wrapper_from_lines(wrapper, w, line, l, desktop_lines),
					current: wrapper,
					order: ed._wrapper_index
				});
			});
		});

		if ( adapt_wrappers.length == 0 ) {
			// Nothing to adapt, return
			return;
		}

		// Let's split up to wrappers that inserted to top, bottom or in between
		adapt_wrappers = _.filter(adapt_wrappers, function (adapt_wrapper, aw) {
			if ( aw == adapt_wrapper.order-1 ) {
				adapt_wrappers_top.push(adapt_wrapper);
				return false;
			}
			else if ( ed._wrapper_index == adapt_wrapper.order + (adapt_wrappers.length - aw - 1) ) {
				adapt_wrappers_bottom.push(adapt_wrapper);
				return false;
			}
			return true;
		});

		// Make them into lines
		adapt_lines_top = ed._adapt_wrappers_to_line(adapt_wrappers_top, parent_col);
		adapt_lines = ed._adapt_wrappers_to_line(adapt_wrappers, parent_col);
		adapt_lines_insert = adapt_lines.slice(0);
		adapt_lines_bottom = ed._adapt_wrappers_to_line(adapt_wrappers_bottom, parent_col);

		ed._wrapper_index = 0;
		// Now that when we know which wrappers we need to adapt, we'll find where to add them
		// Add the top wrappers
		_.each(adapt_lines_top, function (adapt_line) {
			ed._set_adapt_wrappers(adapt_line.wrappers, parent_col, silent, breakpoint);
		});

		// Insert between elements
		_.each(filtered_lines, function (line, l) {
			var prev_line = ( l > 0 ) ? filtered_lines[l-1] : false,
				next_line = ( l < filtered_lines.length-1 ) ? filtered_lines[l+1] : false
			;
			_.each(line.wrappers, function (wrapper, w) {
				var inserted = [];
				_.each(adapt_lines_insert, function (adapt_line, al) {
					var prev_wrapper = adapt_line.prev_wrapper,
						next_wrapper = adapt_line.next_wrapper,
						is_adding = false,
						apply_col = Math.floor(parent_col/adapt_line.wrappers.length),
						remaining_col = parent_col - (apply_col * adapt_line.wrappers.length)
					;
					_.each(adapt_line.wrappers, function (adapt_wrapper) {
						if ( ed._find_wrapper_in_line(prev_wrapper, prev_line) ) {
							// Try use prev wrapper as reference first
							is_adding = true;
						}
						else if ( ed._find_wrapper_in_line(next_wrapper, line) && !ed._find_wrapper_in_line(prev_wrapper, line) ) {
							// Alternatively, just use next wrapper as reference
							is_adding = true;
						}
					})

					if ( !is_adding ) return;
					// Finally, add this line in
					ed._set_adapt_wrappers(adapt_line.wrappers, parent_col, silent, breakpoint)
					inserted.push(al);
				});
				// Remove inserted lines
				_.each(inserted, function (ins, i) {
					adapt_lines_insert.splice(ins - i, 1);
				});

				// Set new order for existing wrappers
				ed._wrapper_index++;
				wrapper.model.set_breakpoint_property('order', ed._wrapper_index, silent, breakpoint);
			});
		});

		// Add the bottom wrappers and the rest of uninserted wrappers
		_.each(_.union(adapt_lines_insert, adapt_lines_bottom), function (adapt_line) {
			ed._set_adapt_wrappers(adapt_line.wrappers, parent_col, silent, breakpoint);
		});
	},

	_set_adapt_wrappers: function (adapt_wrappers, parent_col, silent, breakpoint) {
		var apply_col = Math.floor(parent_col/adapt_wrappers.length),
			remaining_col = parent_col - (apply_col * adapt_wrappers.length),
			ed = this
		;
		_.each(adapt_wrappers, function (adapt_wrapper, aw) {
			var this_col = apply_col;
			if ( remaining_col > 0 ) {
				this_col++;
				remaining_col--;
			}
			ed._wrapper_index++;
			adapt_wrapper.current.model.set_breakpoint_property('clear', ( aw == 0 ), silent, breakpoint);
			adapt_wrapper.current.model.set_breakpoint_property('col', this_col, silent, breakpoint);
			adapt_wrapper.current.model.set_breakpoint_property('order', ed._wrapper_index, silent, breakpoint);
			_.each(adapt_wrapper.current.modules, function (module, m) {
				module.model.set_breakpoint_property('col', this_col, silent, breakpoint);
			});
		});
	},

	_filter_edited_lines: function (lines, breakpoint) {
		return _.filter(lines, function (line) {
			var ignore = false;
			_.each(line.wrappers, function (wrapper) {
				if ( wrapper.spacer || ignore ) return;
				var is_edited = wrapper.model.get_breakpoint_property_value('edited', false, false, breakpoint);
				if ( !is_edited ) {
					ignore = true;
					return;
				}
			});
			return !ignore;
		});
	},

	_adapt_wrappers_to_line: function (wrappers, col) {
		var adapt_col = 0,
			adapt_lines = [],
			adapt_wrappers = [],
			prev_wrapper = false,
			ref_prev_wrapper = false,
			ref_next_wrapper = false
		;
		_.each(wrappers, function (wrapper, w) {
			var is_separate_line = (prev_wrapper && wrapper.order - prev_wrapper.order > 1);
			if ( ( is_separate_line || adapt_col + wrapper.current.col > col ) && adapt_wrappers.length > 0 ) {
				adapt_lines.push({
					wrappers: adapt_wrappers,
					col: adapt_col,
					prev_wrapper: ref_prev_wrapper,
					next_wrapper: ref_next_wrapper
				});
				adapt_wrappers = [];
				adapt_col = 0;
				if ( is_separate_line ) {
					ref_prev_wrapper = false;
					ref_next_wrapper = false;
				}
			}
			if ( ref_prev_wrapper === false ) {
				ref_prev_wrapper = wrapper.prev;
			}
			if ( ref_next_wrapper === false ) {
				ref_next_wrapper = wrapper.next;
				for ( var i = w+1; i < wrappers.length; i++ ) {
					if ( wrappers[i].order - wrapper.order > 1 ) break;
					ref_next_wrapper = wrappers[i].next;
				}
			}
			adapt_col += wrapper.current.col;
			adapt_wrappers.push(wrapper);
			prev_wrapper = wrapper;
		});
		if ( adapt_wrappers.length > 0 ) {
			adapt_lines.push({
				wrappers: adapt_wrappers,
				col: adapt_col,
				prev_wrapper: ref_prev_wrapper,
				next_wrapper: ref_next_wrapper
			});
		}
		return adapt_lines;
	},

	_find_prev_wrapper_from_lines: function (wrapper, wrapper_index, line, line_index, lines) {
		if ( wrapper_index > 0 ) {
			if ( !line.wrappers[wrapper_index-1].spacer ) {
				return line.wrappers[wrapper_index-1];
			}
			else if ( wrapper_index > 1 ) {
				return line.wrappers[wrapper_index-2];
			}
		}
		if ( line_index > 0 ) {
			for ( var i = lines[line_index-1].wrappers.length-1; i >= 0; i-- ) {
				if ( lines[line_index-1].wrappers[i].spacer ) continue;
				return lines[line_index-1].wrappers[i];
			}
		}
		return false;
	},

	_find_next_wrapper_from_lines: function (wrapper, wrapper_index, line, line_index, lines) {
		if ( wrapper_index < line.wrappers.length-1 ) {
			if ( !line.wrappers[wrapper_index+1].spacer ) {
				return line.wrappers[wrapper_index+1];
			}
			else if ( wrapper_index < line.wrappers.length-2 ) {
				return line.wrappers[wrapper_index+2];
			}
		}
		if ( line_index < lines.length-1 ) {
			for ( var i = 0; i < lines[line_index+1].wrappers.length; i++ ) {
				if ( lines[line_index+1].wrappers[i].spacer ) continue;
				return lines[line_index+1].wrappers[i];
			}
		}
		return false;
	},

	_find_wrapper_in_line: function (find_wrapper, line) {
		if ( !line || !line.wrappers || !find_wrapper ) return false;
		if ( line.wrappers.length == 0 ) return false;
		return _.find(line.wrappers, function (wrapper, w) {
			return ( find_wrapper.model.cid == wrapper.model.cid );
		});
	},

	/**
	 * Call this to adapt region to the breakpoint
	 */
	adapt_region_to_breakpoint: function (regions, breakpoint_id, col, silent) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			default_breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default().toJSON(),
			line_col = 0,
			silent = ( silent === true ) ? true : false
		;
		regions.each(function(region){
			var data = Upfront.Util.clone( region.get_property_value_by_name('breakpoint') || {} ),
				region_col = region.get_property_value_by_name('col'),
				sub = region.get('sub')
			;
			if ( !_.isObject(data[breakpoint_id]) ) {
				data[breakpoint_id] = { edited: false };
			}
			if ( !data[breakpoint_id].edited ){
				if ( region.is_main() || ( !sub || sub.match(/^(left|right)$/) )  ){
					// Sidebar/main region, let's make the column to full width on responsive
					data[breakpoint_id].col = default_breakpoint.columns;
				}
				else if ( sub.match(/^lightbox$/) ) {
					// Lightbox, resize if bigger than current breakpoint
					if ( region_col > col ) {
						data[breakpoint_id].col = col;
					}
				}
			}
			region.set_property('breakpoint', data, silent);
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
			$layout = $main.find('.upfront-layout'),
			collection = model.collection,
			index = collection.indexOf(model),
			total = collection.size()-1, // total minus shadow region
			sub = model.get('sub'),
			container = model.get('container'),
			directions, handles, axis,
			fixed_pos = {},
			get_fixed_pos = function () {
				var pos = {
						top: model.get_property_value_by_name('top'),
						left: model.get_property_value_by_name('left'),
						bottom: model.get_property_value_by_name('bottom'),
						right: model.get_property_value_by_name('right'),
						width: model.get_property_value_by_name('width'),
						height: model.get_property_value_by_name('height')
					};
				pos.is_top = ( typeof pos.top == 'number' );
				pos.is_left = ( typeof pos.left == 'number' );
				pos.is_bottom = ( typeof pos.bottom == 'number' );
				pos.is_right = ( typeof pos.right == 'number' );
				return pos;
			}
		;
		if ( $me.data('ui-resizable') )
			return false;
		if ( !model.is_main() && sub && !sub.match(/^(fixed|left|right)$/) )
			return;
		if ( model.is_main() ){
			directions = ['s'];
			handles = { s: '.upfront-region-resize-handle-s' };
		}
		else if ( sub == 'left' ){
			directions = ['e', 's'];
			handles = { e: '.upfront-region-resize-handle-e', s: '.upfront-region-resize-handle-s' };
		}
		else if ( sub == 'right' ) {
			directions = ['w', 's'];
			handles = { w: '.upfront-region-resize-handle-w', s: '.upfront-region-resize-handle-s' };
		}
		else if ( sub == 'fixed' ) {
			fixed_pos = get_fixed_pos();
			if ( ( fixed_pos.is_top && fixed_pos.is_left ) || ( fixed_pos.is_bottom && fixed_pos.is_right ) ){
				directions = ['nw', 'se'];
				handles = { nw: '.upfront-region-resize-handle-nw', se: '.upfront-region-resize-handle-se' };
			}
			else{
				directions = ['ne', 'sw'];
				handles = { ne: '.upfront-region-resize-handle-ne', sw: '.upfront-region-resize-handle-sw' };
			}
		}
		_.each(directions, function(direction){
			var icon = ( direction.match(/^(e|w|s|n)$/) ) ? 'upfront-icon-control-region upfront-icon-control-region-resize upfront-icon-control-region-resize-' + direction : 'upfront-icon-control upfront-icon-control-resize upfront-icon-control-resize-' + direction;
			$me.append('<div class="' + icon + ' upfront-region-resize-handle upfront-region-resize-handle-' + direction + ' ui-resizable-handle ui-resizable-' + direction + '"></div>');
		});
		$me.resizable({
			containment: "document",
			//handles: "n, e, s, w",
			handles: handles,
			helper: "region-resizable-helper",
			disabled: true,
			zIndex: 9999999,
			start: function(e, ui){
				var col = ed.get_class_num($me, ed.grid['class']),
					data = $(this).data('ui-resizable'),
					$helper = ui.helper;
				axis = data.axis ? data.axis : 'se';

				// Prevents quick scroll when resizing
				ed.resizing = window.scrollY;

				$(this).resizable('option', 'minWidth', ed.col_size*3);
				if ( sub != 'fixed' ){
					$(this).resizable('option', 'maxWidth', ed.col_size*10);
				}
				else {
					$(this).resizable('option', 'minHeight', ed.baseline*3);
					$me.css('position', '');
					view.update_region_position();
					fixed_pos = get_fixed_pos();
					// Hack into resizable instance
					var me_pos = $me.position();
					data.originalPosition.left = me_pos.left;
					data.originalPosition.top = me_pos.top;
					data.originalSize.width = fixed_pos.width;
					data.originalSize.height = fixed_pos.height;
					data._updateCache({
						left: me_pos.left,
						top: me_pos.top
					});
					$helper.css({
						marginLeft: 0,
						marginTop: 0,
						left: me_pos.left,
						top: me_pos.top,
						position: 'fixed'
					});
				}
				Upfront.Events.trigger("entity:region:resize_start", view, view.model);
			},
			resize: function(e, ui){
				var $helper = ui.helper;
				if ( sub != 'fixed' ){
					if ( axis == 's' ) {
						var current_row = Math.abs(Math.ceil(ui.size.height/ed.baseline)),
							h = Math.round(current_row*ed.baseline);
						$helper.css({
							height: h,
							width: ui.originalSize.width,
							minWidth: ui.originalSize.width,
							maxWidth: ui.originalSize.width
						});
						view.update_size_hint(ui.originalSize.width, h);
						$me.data('resize-row', current_row);
					}
					else {
						var col = ed.get_class_num($me, ed.grid['class']),
							$prev = $me.prevAll('.upfront-region:first'),
							$next = $me.nextAll('.upfront-region:first'),
							prev_col = $prev.size() > 0 ? ed.get_class_num($prev, ed.grid['class']) : 0,
							next_col = $next.size() > 0 ? ed.get_class_num($next, ed.grid['class']) : 0,
							max_col = col + ( next_col > prev_col ? next_col : prev_col ),
							current_col = Math.abs(Math.ceil(ui.size.width/ed.col_size)),
							rsz_col = ( current_col > max_col ? max_col : current_col ),
							w = Math.round(rsz_col*ed.col_size)
						;
						$helper.css({
							height: ui.originalSize.height,
							width: w,
							minWidth: w,
							maxWidth: w,
							marginLeft: axis == 'w' ? ui.size.width-w : 0
						});
						view.update_size_hint(w, ui.originalSize.height);
						$me.data('resize-col', rsz_col);
					}
				}
				else {
					var offset = $me.offset(),
						main_offset = $main.offset(),
						height = $me.height(),
						width = $me.width(),
						max_height = max_width = false,
						rsz_width, rsz_height;
					if ( fixed_pos.is_top )
						max_height = axis == 'nw' || axis == 'ne' ? fixed_pos.top + height : false;
					if ( !fixed_pos.is_top && fixed_pos.is_bottom )
						max_height = axis == 'se' || axis == 'sw' ? fixed_pos.bottom + height : false;
					if ( fixed_pos.is_left )
						max_width = axis == 'nw' || axis == 'sw' ? fixed_pos.left + width : false;
					if ( !fixed_pos.is_left && fixed_pos.is_right )
						max_width = axis == 'se' || axis == 'ne' ? fixed_pos.right + width : false;
					rsz_height = Math.round( max_height && ui.size.height > max_height ? max_height : ui.size.height );
					rsz_width = Math.round( max_width && ui.size.width > max_width ? max_width : ui.size.width );
					$helper.css({
						height: rsz_height,
						width: rsz_width
					});
					view.update_size_hint(rsz_width, rsz_height, $helper);
					$me.data('resize-height', rsz_height);
					$me.data('resize-width', rsz_width);
				}
			},
			stop: function(e, ui){
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					model_breakpoint, breakpoint_data;
				// Prevents quick scroll when resizing
				ed.resizing = false;

				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				$me.css({
					width: '',
					minWidth: '',
					maxWidth: '',
					height: '',
					position: '',
					top: '',
					left: '',
					right: '',
					bottom: ''
				});
				if ( sub != 'fixed' ){
					var rsz_col = $me.data('resize-col'),
						rsz_row = $me.data('resize-row');
					if ( !breakpoint || breakpoint['default'] ){
						if ( rsz_col )
							model.set_property('col', rsz_col);
						if ( rsz_row )
							model.set_property('row', rsz_row);
					}
					else {
						if ( rsz_col || rsz_row ){
							model_breakpoint = Upfront.Util.clone(model.get_property_value_by_name('breakpoint') || {});
							if ( !_.isObject(model_breakpoint[breakpoint.id]) )
								model_breakpoint[breakpoint.id] = {};
							breakpoint_data = model_breakpoint[breakpoint.id];
							breakpoint_data.edited = true;
							if ( rsz_col )
								breakpoint_data.col = rsz_col;
							if ( rsz_row )
								breakpoint_data.row = rsz_row;
							model.set_property('breakpoint', model_breakpoint);
						}
					}
					$me.removeData('resize-col');
					$me.removeData('resize-row');
				}
				else {
					var rsz_width = $me.data('resize-width'),
						rsz_height = $me.data('resize-height'),
						rsz_col = Math.floor(rsz_width/ed.col_size);
					if ( ( axis == 'nw' || axis == 'ne' ) && fixed_pos.is_top )
						model.set_property('top', fixed_pos.top + fixed_pos.height - rsz_height);
					if ( ( axis == 'se' || axis == 'sw' ) && !fixed_pos.is_top && fixed_pos.is_bottom )
						model.set_property('bottom', fixed_pos.bottom + fixed_pos.height - rsz_height);
					if ( ( axis == 'nw' || axis == 'sw') && fixed_pos.is_left )
						model.set_property('left', fixed_pos.left + fixed_pos.width - rsz_width);
					if ( ( axis == 'se' || axis == 'ne' ) && !fixed_pos.is_left && fixed_pos.is_right )
						model.set_property('right', fixed_pos.right + fixed_pos.width - rsz_width);
					model.set_property('width', rsz_width, true);
					model.set_property('height', rsz_height, true);
					model.set_property('col', rsz_col, true);
					model.get('properties').trigger('change');
					$me.removeData('resize-width');
					$me.removeData('resize-height');
				}
				Upfront.Events.trigger("entity:region:resize_stop", view, view.model);
			}
		});
	},

	create_region_draggable: function(view, model) {
		if ( !model.get("container") || model.get("container") == model.get("name") )
			return;
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$me = view.$el,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			container_view = view.parent_view.get_container_view(model),
			sub = model.get('sub'),
			fixed_pos = {},
			restrict = false,
			get_fixed_pos = function () {
				var pos = {
						top: model.get_property_value_by_name('top'),
						left: model.get_property_value_by_name('left'),
						bottom: model.get_property_value_by_name('bottom'),
						right: model.get_property_value_by_name('right'),
						width: model.get_property_value_by_name('width'),
						height: model.get_property_value_by_name('height')
					};
				pos.is_top = ( typeof pos.top == 'number' );
				pos.is_left = ( typeof pos.left == 'number' );
				pos.is_bottom = ( typeof pos.bottom == 'number' );
				pos.is_right = ( typeof pos.right == 'number' );
				return pos;
			},
			move = {},
			position = ''
		;
		if ( sub != 'fixed' )
			return false;
		if ( $me.data('ui-draggable') )
			return false;

		$me.draggable({
			disabled: true,
			revert: true,
			revertDuration: 0,
			zIndex: 100,
			helper: 'clone',
			delay: 15,
			scroll: false,
			iframeFix: true,
			start: function (e, ui) {
				var $helper = ui.helper,
					width = $me.width(),
					height = $me.height();
				$helper.css('width', width);
				$helper.css('height', height);
				$me.hide();
				fixed_pos = get_fixed_pos();
				restrict = model.get('restrict_to_container');
				position = $helper.css('position');
			},
			drag: function (e, ui) {
				var $helper = ui.helper,
					main_offset = $main.offset(),
					main_width = $main.width(),
					container_offset = container_view.$el.offset(),
					container_height = container_view.$el.height(),
					container_bottom = container_offset.top + container_height,
					scroll_top = $(window).scrollTop(),
					win_height = $(window).height(),
					scroll_bottom = scroll_top + win_height,
					main_x = ( main_width / 2 ) + main_offset.left,
					main_y = ( position == 'fixed' || container_height > win_height ) ? win_height / 2 : container_height / 2,
					left = ui.position.left,
					top = ui.position.top,
					width = $helper.width(),
					height = $helper.height(),
					x = (width/2) + left,
					y = (height/2) + top,
					limit_top, limit_left, helper_top, helper_left;
				// reset move variable
				move = {};
				if ( position == 'absolute' && container_height > win_height && container_bottom <= scroll_bottom )
					main_y = container_height - ( win_height / 2 );
				if ( y <= main_y ){
					if ( position == 'fixed' || container_height < win_height || container_bottom >= scroll_bottom )
						limit_top = 0;
					else
						limit_top = container_height - win_height;
					helper_top = top < limit_top ? limit_top : top;
					move.top = helper_top - limit_top;
				}
				else {
					if ( position == 'fixed' || ( container_height > win_height && container_offset.top >= scroll_top ) )
						limit_top = win_height - height;
					else
						limit_top = container_height - height;
					helper_top = top > limit_top ? limit_top : top;
					move.bottom = limit_top - helper_top;
				}
				if ( x <= main_x ){
					limit_left = main_offset.left;
					helper_left = left < limit_left ? limit_left : left;
					move.left = helper_left - limit_left;
				}
				else {
					limit_left = main_width - width + main_offset.left;
					helper_left = left > limit_left ? limit_left : left;
					move.right = limit_left - helper_left;
				}
				view.update_position_hint(move, $helper);
				ui.position.top = helper_top;
				ui.position.left = helper_left;
			},
			stop: function (e, ui) {
				$me.show();
				if ( typeof move.top == 'number' ){
					model.set_property('top', move.top, true);
					model.remove_property('bottom', true);
				}
				else if ( typeof move.bottom == 'number' ){
					model.set_property('bottom', move.bottom, true);
					model.remove_property('top', true);
				}
				if ( typeof move.left == 'number' ){
					model.set_property('left', move.left, true);
					model.remove_property('right', true);
				}
				else if ( typeof move.right == 'number' ){
					model.set_property('right', move.right, true);
					model.remove_property('left', true);
				}
				model.get('properties').trigger('change');
			}
		});
	},


	/**
	 * Create region resizable
	 *
	 * @param {Object} view
	 * @param {Object} model
	 */
	create_region_container_resizable: function(view, model){
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$me = view.$el,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			sub = model.get('sub'),
			direction = 's',
			handles = {},
			$layout = $main.find('.upfront-layout')
		;
		if ( $me.data('ui-resizable') )
			return false;
		if ( !model.is_main() && sub == 'bottom' )
			direction = 'n';
		$me.append('<div class="upfront-icon-control-region upfront-icon-control-region-resize upfront-icon-control-region-resize-' + direction + ' upfront-region-resize-handle upfront-region-resize-handle-' + direction + ' ui-resizable-handle ui-resizable-' + direction + '"></div>');
		handles[direction] = '.upfront-region-resize-handle-' + direction;
		$me.resizable({
			containment: "document",
			//handles: "n, e, s, w",
			handles: handles,
			helper: "region-resizable-helper",
			disabled: true,
			zIndex: 9999999,
			start: function(e, ui){
				Upfront.Events.trigger("entity:region_container:resize_start", view, view.model);
				// Disable region changing
				Upfront.Events.trigger('command:region:edit_toggle', false);
				// Prevents quick scroll when resizing
				//ed.resizing = window.scrollY;
				// Preparing for auto scrolling on resize event
				ed._prepare_resize_auto_scroll(ui, $layout.find('> .upfront-regions'));
			},
			resize: function(e, ui){
				var $helper = ui.helper,
					h = ( (ui.size.height > 15 ? ui.size.height : 0) || ui.originalSize.height ),
					rsz_row = Math.ceil(h/ed.baseline),
					data = $(this).data('ui-resizable')
				;
				$helper.css({
					width: $me.width(),
					height: rsz_row * ed.baseline
				});
				$me.data('resize-row', rsz_row);

				var region_view = Upfront.data.region_views[model.cid];
				if ( region_view )
					region_view.update_size_hint(region_view.$el.width(), rsz_row * ed.baseline);
				_.each(view.sub_model, function (sub_model) {
					var sub_view = Upfront.data.region_views[sub_model.cid];
					if ( sub_view && ( sub_view.$el.hasClass('upfront-region-side-left') || sub_view.$el.hasClass('upfront-region-side-right')) )
						sub_view.update_size_hint(sub_view.$el.width(), rsz_row * ed.baseline);
				});

				// Auto scrolling when it hits bottom
				ed._start_resize_auto_scroll(e, ui, h, data);
			},
			stop: function(e, ui){
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					rsz_row = $me.data('resize-row'),
					model_breakpoint, breakpoint_data;

				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				$me.css({
					width: '',
					minHeight: '',
					height: '',
					maxHeight: '',
					position: '',
					top: '',
					left: ''
				});

				// Make sure auto scrolling is cleared
				ed._clear_resize_auto_scroll();

				if ( !breakpoint || breakpoint['default'] ){
					model.set_property('row', rsz_row);
				}
				else {
					model_breakpoint = Upfront.Util.clone(model.get_property_value_by_name('breakpoint') || {});
					if ( !_.isObject(model_breakpoint[breakpoint.id]) )
						model_breakpoint[breakpoint.id] = {};
					breakpoint_data = model_breakpoint[breakpoint.id];
					breakpoint_data.edited = true;
					breakpoint_data.row = rsz_row;
					model.set_property('breakpoint', model_breakpoint);
				}

				$me.removeData('resize-row');

				Upfront.Events.trigger("entity:region_container:resize_stop", view, view.model);
				// Re-enable region changing
				Upfront.Events.trigger('command:region:edit_toggle', true);


				// Prevents quick scroll when resizing
				ed.resizing = false;
			}
		});
	},

	/**
	 * Auto scrolling when hit bottom
	 */
	_auto_scroll_t: false,
	_auto_scroll_data: {},
	_auto_scroll_step: 3,
	_auto_scroll_timeout: 100,

	/**
	 * Preparing data for auto scroll
	 */
	_prepare_resize_auto_scroll: function(ui, $parent){
		var document_height = $(document).height(),
			$scroller = $('<div class="upfront-auto-scroller"></div>');
		$scroller.css({
			width: 1,
			height: 0,
			visibility: 'hidden'
		}).appendTo( $parent ? $parent : 'body' );
		this._auto_scroll_data = {
			document_height: document_height,
			position_top: ui.originalPosition.top,
			position_height: ui.originalSize.height,
			position_rest: document_height - ( ui.originalPosition.top + ui.originalSize.height ),
			$scroller: $scroller
		};
	},

	/**
	 * Calling the auto scrolling on resize event, need direct access to resizable object
	 */
	_start_resize_auto_scroll: function (e, ui, height, data) {
		var me = this,
			window_height = $(window).height(),
			mouse_offset = Math.abs( window_height - e.clientY ),
			added_height = height - this._auto_scroll_data.position_height,
			added_scroll = added_height - this._auto_scroll_data.position_rest,
			auto_height = 0,
			step = this._auto_scroll_step * this.baseline,
			$helper = ui.helper;
		clearTimeout(this._auto_scroll_t);
		//if ( added_scroll > 0 )
		//	this._auto_scroll_data.$scroller.height(added_scroll);
		if ( mouse_offset > 50 )
			return;
		this._auto_scroll_t = setTimeout(function(){
			auto_height += step;
			if ( added_scroll + auto_height > 0 )
				me._auto_scroll_data.$scroller.height(added_scroll + auto_height + mouse_offset);
			data.size.height = height + auto_height;
			data.parentData.height = $(document).height();
			$helper.css('height', data.size.height);
			$(window).scrollTop( $(window).scrollTop() + step );
			data._trigger('resize', e, ui);
		}, this._auto_scroll_timeout);
	},

	_clear_resize_auto_scroll: function () {
		this._auto_scroll_data.$scroller.remove();
		clearTimeout(this._auto_scroll_t);
	},

	/**
	 * Toggle region resizable
	 *
	 */
	toggle_region_resizable: function(enable){
		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$regions;
		if ( enable ) {
			if ( $main.hasClass('upfront-region-fixed-editing') )
				$regions = $('.upfront-region-side-fixed');
			else
				$regions = $('.upfront-region-center, .upfront-region-side-left, .upfront-region-side-right, .upfront-region-container-wide, .upfront-region-container-clip, .upfront-region-sub-container');
			$regions.each(function(){
				if ( $(this).data('ui-resizable') )
					$(this).resizable('option', 'disabled', false);
			});
		}
		else {
			$('.upfront-region, .upfront-region-container').each(function(){
				if ( $(this).data('ui-resizable') )
					$(this).resizable('option', 'disabled', true);
			});
		}
	},

	/**
	 * Toggle region draggable
	 *
	 */
	toggle_region_draggable: function(enable){
		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$regions;
		if ( enable ) {
			if ( $main.hasClass('upfront-region-fixed-editing') )
				$regions = $('.upfront-region-side-fixed');
			else
				$regions = $('.upfront-region-side-left, .upfront-region-side-right, .upfront-region-container-wide, .upfront-region-container-clip');
			$regions.each(function(){
				if ( $(this).data('ui-draggable') )
					$(this).draggable('option', 'disabled', false);
			});
		}
		else {
			$('.upfront-region, .upfront-region-container').each(function(){
				if ( $(this).data('ui-draggable') )
					$(this).draggable('option', 'disabled', true);
			});
		}
	},

	/**
	 * Update grid value and appearance
	 */
	update_grid: function (grid_data) {
		var app = Upfront.Application,
			styles = [],
			grid = Upfront.Settings.LayoutEditor.Grid,
			selector = '#page',
			options = app.layout.get_property_value_by_name('grid') || {
				column_widths: {},
				column_paddings: {},
				baselines: {},
				type_paddings: {}
			},
			// Dealing with responsive settings which, apparently, trump the grid entirely
			current_bp_id = Upfront.Settings.LayoutEditor.CurrentBreakpoint || Upfront.Settings.LayoutEditor.Grid.size_name,
			breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().findWhere({id: ( _.isObject(current_bp_id) ? current_bp_id.id : current_bp_id )}),
			flag_update_breakpoint = false
		;

		if (grid_data.column_width) {
			options.column_widths[grid.size_name] = grid_data.column_width;
			if (breakpoint.get_property_value_by_name('column_width') != grid_data.column_width) {
				breakpoint.set_property("column_width", grid_data.column_width);
				flag_update_breakpoint = true;
			}
		}
		if ("column_padding" in grid_data) { // Special case! Allow zero values in column paddings
			options.column_paddings[grid.size_name] = grid_data.column_padding;
			if (breakpoint.get_property_value_by_name('column_padding') != grid_data.column_padding) {
				breakpoint.set_property("column_padding", grid_data.column_padding);
				flag_update_breakpoint = true;
			}
		}
		if (grid_data.baseline) {
			if (grid_data.baseline != grid.baseline) {
				// to prevent css loading at every change, we timeout to 1000ms before decide to load it
				clearTimeout(this._load_editor_css);
				this._load_editor_css = setTimeout(function() {
					Upfront.Util.post({
						action: 'upfront_load_editor_grid',
						baseline: grid_data.baseline
					}, 'text').success(function(data) {
						if ( $('#upfront-editor-grid-inline').length )
							$('#upfront-editor-grid-inline').html( data );
						else
							$('head').append('<style id="upfront-editor-grid-inline">' + data + '</style>'); // add it to head to prevent it override other custom CSS below
					});
				}, 1000);
			}
			options.baselines[grid.size_name] = grid_data.baseline;
			if (breakpoint.get_property_value_by_name('baseline') != grid_data.baseline) {
				breakpoint.set_property("baseline", grid_data.baseline);
				flag_update_breakpoint = true;
			}
		}
		if (grid_data.type_padding) {
			options.type_paddings[grid.size_name] = grid_data.type_padding;
			if (breakpoint.get_property_value_by_name('type_padding') != grid_data.type_padding) {
				breakpoint.set_property("type_padding", grid_data.type_padding);
				flag_update_breakpoint = true;
			}
		}
		Upfront.Settings.LayoutEditor.Grid = _.extend(grid, grid_data);
		app.layout.set_property('grid', options);
		app.layout_view.update_grid_css();
		this.init(); // re-init to update grid values

		if ( app.layout_ready ) {
			// Trigger updated event if it is changed after layout finished rendering
			Upfront.Events.trigger('upfront:grid:updated');
			// Second event for stuff that happen afterward
			Upfront.Events.trigger('upfront:grid:updated:after');
		}

		if (
				flag_update_breakpoint &&
				true === Upfront.plugins.isRequiredByPlugin('update grid')
		) {
			breakpoint.trigger("change:enabled", breakpoint);
		}
	},

	/**
	 * Debug stuff
	 */
	time_start: function (id) {
		if ( this.show_debug_element )
			console.time(id);
	},
	time_end: function (id) {
		if ( this.show_debug_element )
			console.timeEnd(id);
	},
	set_timeout: function(timeout){
		this.timeout = timeout;
	},
	set_compare_size: function(col, row){
		this.compare_col = col;
		this.compare_row = row;
	},
	toggle_debug: function(){
		this.show_debug_element = !this.show_debug_element;
		if ( this.show_debug_element )
			this.render_debug();
		else
			this.delete_debug();
	},
	render_debug: function () {
		var me = this,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main);
			$modal = $('<div id="behavior-debug" class="upfront-inline-modal"></div>'),
			$wrap = $('<div class="upfront-inline-modal-wrap"></div>'),
			field_delay = new Upfront.Views.Editor.Field.Number({
				name: 'delay',
				label: Upfront.Settings.l10n.global.behaviors.delay_before_drag,
				label_style: 'inline',
				min: 0,
				max: 2000,
				step: 1,
				default_value: 300,
				change: function () {
					$('.upfront-module.ui-draggable, .upfront-module-group.ui-draggable, .upfront-object.ui-draggable').draggable('option', 'delay', this.get_value());
				}
			}),
			field_timeout = new Upfront.Views.Editor.Field.Number({
				name: 'timeout',
				label: Upfront.Settings.l10n.global.behaviors.delay_before_changing_position,
				label_style: 'inline',
				min: 0,
				max: 2000,
				step: 1,
				default_value: me.timeout,
				change: function () {
					me.timeout = parseInt(this.get_value(), 10);
				}
			}),
			field_debug = new Upfront.Views.Editor.Field.Checkboxes({
				name: 'debug',
				multiple: false,
				default_value: true,
				values: [
					{ label: Upfront.Settings.l10n.global.behaviors.show_debug_info, value: true }
				],
				change: function () {
					me.show_debug_element = this.get_value() ? true : false;
				}
			}),
			$close = $('<a href="#" class="upfront-close-debug">' + Upfront.Settings.l10n.global.behaviors.close + '</a>');
		$main.addClass('show-debug');
		field_delay.render();
		$wrap.append(field_delay.$el);
		field_timeout.render();
		$wrap.append(field_timeout.$el);
		field_debug.render();
		$wrap.append(field_debug.$el);
		$wrap.append($close);
		$modal.append($wrap);
		$('body').append($modal);
		$modal.css({
			top: 'auto',
			left: 'auto',
			bottom: 0,
			right: 0,
			position: 'fixed'
		});
		$wrap.css({
			width: 360,
			top: 0,
			padding: '10px',
			position: 'relative'
		});
		$close.on('click', function () {
			me.show_debug_element = false;
			me.delete_debug();
		});
	},
	delete_debug: function () {
		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
		$main.removeClass('show-debug');
		$('#behavior-debug').remove();
	}

};

	return GridEditor;
});

})(jQuery);
//# sourceURL=grid-editor.js
