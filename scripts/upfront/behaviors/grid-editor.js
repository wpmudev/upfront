(function ($) {
	
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
		lightbox: 2,
	},

	els: [],
	wraps: [],
	regions: [],
	drops: [],

	drop: null,

	el_selector: '.upfront-module, .upfront-module-group',
	_id: 0,

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
			grid_x = Math.round((x-ed.grid_layout.left)/ed.col_size)+1,
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
			width = $el.outerWidth(),
			height = $el.outerHeight(),
			top = $el.offset().top,
			left = $el.offset().left,
			outer_width = $el.outerWidth(true),
			outer_height = $el.outerHeight(true),
			outer_top = top-parseFloat($el.css('margin-top')),
			outer_left = left-parseFloat($el.css('margin-left')),
			grid = ed.get_grid(left, top),
			outer_grid = ed.get_grid(outer_left, outer_top),
			col = Math.round(width/ed.col_size),
			outer_col = Math.round(outer_width/ed.col_size),
			row = Math.ceil(height/ed.baseline),
			outer_row = Math.ceil(outer_height/ed.baseline),
			$region = $el.closest('.upfront-region'),
			region = $region.data('name'),
			$group = $el.closest('.upfront-module-group'),
			group = $group.length > 0 ? $group.attr('id') : false;
		return {
			$el: $el,
			_id: ed._new_id(),
			position: {
				top: top,
				left: left,
				bottom: top+height,
				right: left+width
			},
			outer_position: {
				top: Math.round(outer_top),
				left: Math.round(outer_left),
				bottom: Math.round(outer_top+outer_height),
				right: Math.round(outer_left+outer_width)
			},
			width: width,
			height: height,
			center: {
				y: Math.round(top+(height/2)),
				x: Math.round(left+(width/2))
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
			region: region,
			group: group
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
			col = ed.get_class_num(el.$el, ed.grid.class),
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
			$els = use_wrap.$el.find('> .upfront-module-view > .upfront-module, > .upfront-module-group');
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
		return ( val && val[1] ) ? parseInt(val[1]) : 0;
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
			find_model = function (modules) {
				if ( !modules )
					return false;
				var module_model = modules.get_by_element_id($el.attr('id')),
					found_model;
				if ( module_model )
					return module_model;
				modules.find(function(module){
					if ( module.get('modules') ) {
						found_model = find_model(module.get('modules'));
						return found_model ? true : false;
					}
					else if ( module.get('objects') ) {
						found_model = module.get('objects').get_by_element_id($el.attr('id'));
						return found_model ? true : false;
					}
				});
				return found_model;
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
		if ( !breakpoint || breakpoint.default ){ // apply class if default
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
		if ( model && ( !breakpoint || breakpoint.default ) ){
			model.replace_class(classes.join(' '));
		}
		this.time_end('fn update_model_classes');
	},

	update_model_breakpoint: function ($el, data) {
		var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			model = this.get_el_model($el),
			model_breakpoint;
		if ( model && breakpoint && !breakpoint.default ){
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
				classes, data;
			if (
				( margin && ( margin.original.left != margin.current.left || margin.original.top != margin.current.top ) ) ||
				more_classes
			){
				if ( !breakpoint || breakpoint.default ){
					classes = [
						ed.grid.left_margin_class+margin.current.left,
						ed.grid.top_margin_class+margin.current.top
					];
					if ( more_classes )
						classes = _.union(classes, more_classes);
					ed.update_model_classes($el, classes);
				}
				else {
					data = {
						left: margin.current.left,
						top: margin.current.top
					};
					if ( more_classes )
						_.each(more_classes, function(classname){
							var parse = classname.match(/^([A-Za-z])(\d+)$/);
							if ( parse && parse[1] == ed.grid.class )
								data.col = parseInt(parse[2]);
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
			models_need_move = [],
			is_responsive = ( breakpoint && !breakpoint.default );
		// Remove unneeded wraps from processing
		wraps = _.filter(wraps, function(wrap){
			return ( wrap.$el.is(':visible') || wrap.height > 0 );
		});
		// Iterate through elements and check if it must be contained in separate wrapper
		_.each(wraps, function(wrap){
			var $wrap_els= wrap.$el.find('> .upfront-module-view > .upfront-module, > .upfront-module-group'),
				region = ed.get_region(wrap.$el.closest('.upfront-region')),
				$parent_group = wrap.$el.closest('.upfront-module-group'),
				is_parent_group = ( $parent_group.length > 0 ),
				group = is_parent_group ? ed.get_el($parent_group) : false,
				wrap_index = !is_responsive ? wrap.$el.index('.upfront-wrapper') : wrap.$el.data('breakpoint_order'),
				wrap_cleared = false,
				wrap_top = false,
				wrap_left = false,
				insert_index = false;
				
			// Reset the column size if it's bigger than it allowed to
			$wrap_els.each(function(index){
				if ( this.offsetWidth <= 0 ) // Element is not visible
					return;
				var wrap_el = ed.get_el($(this)),
					col = ( !breakpoint || breakpoint.default ) ? ed.get_class_num(wrap_el.$el, ed.grid.class) : wrap_el.$el.data('breakpoint_col');
				if ( wrap_el.col < col && wrap_el.col > 0 ) {
					ed.update_model_margin_classes(wrap_el.$el, [ed.grid.class + wrap_el.col]);
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

						margin.current.top = margin_top;
						margin.current.left = wrap_el.grid.left-region.grid.left;
						ed.update_model_margin_classes(wrap_el.$el);
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
									var wrap_model = wrappers.get_by_wrapper_id($(this).attr('id'))
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
							if ( aff_wraps.right.length > 0 ) {
								var right_wrap = _.min(aff_wraps.right, function(each){ return each.outer_grid.left; }),
									right_wrap_els = ed.get_wrap_els(right_wrap);
								_.each(right_wrap_els, function(each){
									var each_margin = each.$el.data('margin');
									each_margin.current.left = each.grid.left-wrap_el.outer_grid.left;
									ed.update_model_margin_classes(each.$el);
								});
							}
						}
						if ( is_parent_group )
							groups_need_update.push($parent_group);
						else
							regions_need_update.push(wrap_el.region);
					}
				}
				else if ( wrap_cleared ){
					margin.current.left = wrap_el.grid.left-region.grid.left;
					ed.update_model_margin_classes(wrap_el.$el);
					if ( !is_responsive && insert_index !== false ){
						var model = ed.get_el_model(wrap_el.$el),
							collection = model.collection;
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
							wrap_el_view = Upfront.data.module_views[wrap_el_model.cid],
							parent_view = is_parent_group && wrap_el_view.group_view ? wrap_el_view.group_view : wrap_el_view.region_view,
							parent_el = is_parent_group && group ? group : region,
							wrappers = parent_view.model.get('wrappers'),
							wrapper_id = Upfront.Util.get_unique_id("wrapper"),
							wrap_model = new Upfront.Models.Wrapper({
								"name": "",
								"properties": [
									{"name": "wrapper_id", "value": wrapper_id},
									{"name": "class", "value": ed.grid.class+(wrap_el.grid.left+wrap_el.col-parent_el.grid.left)}
								]
							}),
							wrap_view = new Upfront.Views.Wrapper({model: wrap_model});
						wrappers.add(wrap_model);
						wrap_model.add_class('clr');
						wrap_view.parent_view = wrap_el_view.parent_view;
						wrap_view.render();
						wrap_el.$el.closest('.upfront-wrapper').before(wrap_view.$el);
						wrap_view.$el.append(wrap_el_view.$el);
						wrap_el_model.set_property('wrapper_id', wrapper_id, true);
						wrap_el_model.replace_class(ed.grid.left_margin_class+(wrap_el.grid.left-parent_el.grid.left));
						Upfront.data.wrapper_views[wrap_model.cid] = wrap_view;
						ed.init_margin(wrap_el);
						if ( is_parent_group )
							groups_need_update.push($parent_group);
						else
							regions_need_update.push(wrap_el.region);
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
		if ( !is_responsive ) {
			_.each(models_need_move, function(move){
				move.collection.remove(move.model, {silent: true});
				move.model.add_to(move.collection, move.index);
			});
		}
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

		ed.max_row = Math.floor(($(window).height()*.5)/ed.baseline);
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
		ed.el_selector = is_object ? '.upfront-object' : '.upfront-module, .upfront-module-group';
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
		ed.update_position_data();
		this.time_end('fn start');
	},

	/**
	 * Update position data
	 */
	update_position_data: function () {
		this.time_start('fn update_position_data');
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			$layout = ed.main.$el.find('.upfront-layout'),
			is_object = ( ed.el_selector == '.upfront-object' ),
			$els = is_object ? ed.containment.$el.find('.upfront-object') : $layout.find('.upfront-module, .upfront-module-group'),
			$wraps = $layout.find('.upfront-wrapper'),
			$regions = $layout.find('.upfront-region').not('.upfront-region-locked');
		ed.els = _.map($els, ed.get_position ); // Generate elements position data
		_.each(ed.els, function(el){ ed.init_margin(el); }); // Generate margin data
		ed.wraps = _.map($wraps, ed.get_position ); // Generate wrappers position data
		ed.regions = _.map($regions, ed.get_region_position ); // Generate regions position data
		this.time_end('fn update_position_data');
	},

	/**
	 * Create droppable points
	 */
	create_drop_point: function (me, me_wrap, areas) {
		this.time_start('fn create_drop_point');
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			margin = me.$el.data('margin'),
			col = me.col,
			min_col = me.$el.hasClass('upfront-image_module') ? 1 : (col > ed.min_col ? ed.min_col : col),
			row = me.row > ed.max_row ? ed.max_row : me.row,
			is_spacer = me.$el.hasClass('upfront-module-spacer')
		;

		//check if there is a light box in active state
		var lightbox = false;
		var shadowregion;
		ed.lightbox_cols = false;
		_.each(ed.regions, function(region) {
			if(region.$el.hasClass('upfront-region-side-lightbox') && region.$el.css('display') == 'block') {
//				console.log('found active lightbox');
				lightbox = region;
				ed.lightbox_cols = region.col;
			}
			if(region.$el.hasClass('upfront-region-shadow'))
				shadowregion = region;

		});

		areas = areas ? areas : (lightbox ? [lightbox, shadowregion] : ed.regions);

		ed.drops = [];
		ed.current_row_wraps = false;

		var module_selector = '> .upfront-module-view > .upfront-module, > .upfront-module-group',
			$sibling_els = me.$el.closest('.upfront-wrapper').find(module_selector).each(Upfront.Util.normalize_sort_elements_cb).sort(Upfront.Util.sort_elements_cb),
			has_siblings = $sibling_els.length > 1,
			sibling_index = $sibling_els.index(me.$el);

		_.each(areas, function(area, area_index){
			var is_region = area.$el.hasClass('upfront-region'),
				$area = area.$el.find(".upfront-editable_entities_container:first"),
				$region = is_region ? area.$el : area.$el.closest('.upfront-region'),
				region_name = $region.data('name'),
				region = is_region ? area : ed.get_region($region);
				$wraps = Upfront.Util.find_sorted($area, '> .upfront-wrapper').filter(function(){
					return ( $(this).is(':visible') || $(this).height() > 0 )
				}),
				expand_lock = $region.hasClass('upfront-region-expand-lock'),
				current_full_top = area.grid.top,
				can_drop = function (top, bottom) {
					return ( !expand_lock || ( expand_lock && bottom-top+1 >= me.row ) );
				},
				first_cb = function ($w, $ws) {
					var w = ed.get_wrap($w);
					return ( w.outer_grid.left == area.grid.left );
				};
			$wraps.each(function(index){
				var $wrap = $(this),
					wrap = ed.get_wrap($wrap),
					is_wrap_spacer = ( $wrap.find('> .upfront-module-view > .upfront-module-spacer').length > 0 ),
					wrap_clr = ( wrap.grid.left == area.grid.left ),
					is_wrap_me = ( me_wrap && wrap._id == me_wrap._id ),
					wrap_only = ( $wrap.find(module_selector).size() == 1 ),
					wrap_me_only = ( is_wrap_me && wrap_only ),
					$prev_wrap = $wraps[index-1] ? $wraps.eq(index-1) : false,
					prev_wrap = $prev_wrap ? ed.get_wrap($prev_wrap) : false,
					prev_wrap_clr = ( prev_wrap && prev_wrap.grid.left == area.grid.left ),
					is_prev_me = ( prev_wrap && me_wrap && prev_wrap._id == me_wrap._id ),
					prev_me_only = ( is_prev_me && $prev_wrap.find(module_selector).size() == 1 ),
					$next_wrap = $wraps[index+1] ? $wraps.eq(index+1) : false,
					next_wrap = $next_wrap ? ed.get_wrap($next_wrap) : false,
					next_wrap_clr = ( next_wrap && next_wrap.grid.left == area.grid.left ),
					is_next_me = ( next_wrap && me_wrap && next_wrap._id == me_wrap._id ),
					next_me_only = ( is_next_me && $next_wrap.find(module_selector).size() == 1 ),
					$next_clr = Upfront.Util.find_from_elements($wraps, $wrap, first_cb, false),
					next_clr = $next_clr.size() > 0 ? ed.get_wrap($next_clr) : false,
					wrap_el_left = ed.get_wrap_el_min(wrap),
					wrap_el_top = ed.get_wrap_el_min(wrap, false, true),
					prev_wrap_el_left = prev_wrap ? ed.get_wrap_el_min(prev_wrap) : false,
					next_wrap_el_top = next_wrap ? ed.get_wrap_el_min(next_wrap, false, true) : false,
					next_wrap_el_left = next_wrap ? ed.get_wrap_el_min(next_wrap) : false,
					next_clr_el_top = next_clr ? ed.get_wrap_el_min(next_clr, false, true) : false,
					$row_wrap_first = !wrap_clr ? Upfront.Util.find_from_elements($wraps, $wrap, first_cb, true) : $wrap,
					$row_wraps_next = Upfront.Util.find_from_elements($wraps, $row_wrap_first, '.upfront-wrapper', false, first_cb),
					row_wraps = _.union( [ ed.get_wrap($row_wrap_first) ], $row_wraps_next.map(function(){ return ed.get_wrap($(this)); }).get() ),
					max_row_wrap = _.max(row_wraps, function(row_wrap){ return ( me_wrap && me_wrap._id == row_wrap._id ) ? -1 : row_wrap.grid.bottom; }),
					min_row_wrap = _.min(row_wraps, function(row_wrap){ return ed.get_wrap_el_min(row_wrap, false, true).grid.top; }),
					min_row_el = ed.get_wrap_el_min(min_row_wrap, false, true),
					wrap_me_in_row = _.find(row_wraps, function(row_wrap){ return me_wrap && me_wrap._id == row_wrap._id })
				;
				if ( wrap_me_in_row && ed.current_row_wraps === false ) {
					ed.current_row_wraps = row_wraps;
				}
				
				if (
					!is_spacer
					&&
					!is_wrap_spacer
					&&
					(
						( 
							( !breakpoint || breakpoint.default ) && wrap.col >= min_col && 
							(
								( next_wrap && !next_wrap_clr && !wrap_me_only && ( $next_wrap.find(module_selector).size() > 1 || !is_next_me ) ) ||
								( prev_wrap && !wrap_clr && !wrap_me_only && ( $prev_wrap.find(module_selector).size() > 1 || !is_prev_me ) ) ||
								( next_wrap && prev_wrap && !next_wrap_clr && !wrap_clr ) ||
								( !prev_wrap && !next_wrap && is_wrap_me && $wrap.find(module_selector).size() > 1 )
							)
						)
						||
						( breakpoint && !breakpoint.default && is_wrap_me && $wrap.find(module_selector).size() > 1 )
					)
				){
					var current_el_top = wrap.grid.top,
						wrap_right = ( next_wrap && !next_wrap_clr && next_wrap_el_left ) ? next_wrap_el_left.grid.left-1 : area.grid.right;
					$els = $wrap.find(module_selector).each(Upfront.Util.normalize_sort_elements_cb).sort(Upfront.Util.sort_elements_cb);
					$els.each(function(i){
						if ( $(this).get(0) == me.$el.get(0) ) return;
						var $el = $(this),
							el = ed.get_el($el),
							top = ( el.outer_grid.top == wrap.grid.top ) ? wrap.grid.top : current_el_top,
							bottom = Math.ceil(el.grid_center.y),
							$prev = $els[i-1] ? $els.eq(i-1) : false,
							prev = $prev ? ed.get_el($prev) : false,
							prev_me = ( prev && prev._id == me._id );
						ed.drops.push({
							_id: ed._new_id(),
							top: top,
							bottom: bottom,
							left: wrap.grid.left,
							right: wrap_right,
							priority: {
								top: ( prev_me ? prev.outer_grid.top : el.outer_grid.top-1 ),
								bottom: el.grid.top-1,
								left: wrap.grid.left,
								right: wrap_right,
								index: ( prev_me ? 3 : 5 )
							},
							priority_index: 5,
							type: 'inside',
							insert: ['before', $el],
							region: region,
							is_me: prev_me,
							is_clear: false,
							is_use: false,
							is_switch: false,
							switch_dir: false,
							row_wraps: false,
							me_in_row: false
						});
						current_el_top = bottom+1;
					});
					var $last = $els.last(),
						last = $last.size() > 0 ? ed.get_el($last) : false,
						last_me = ( last && last._id == me._id ),
						wrap_bottom = ( breakpoint && !breakpoint.default && next_clr_el_top ) ? Math.ceil(next_clr_el_top.grid_center.y) : max_row_wrap.grid.bottom;
					// Don't add dropping below the most bottom wrap in a row
					//if ( last_me || !max_row_wrap || max_row_wrap != wrap || ( breakpoint && !breakpoint.default ) ){
						ed.drops.push({
							_id: ed._new_id(),
							top: current_el_top,
							bottom: wrap_bottom,
							left: wrap.grid.left,
							right: wrap_right,
							priority: {
								top: ( last_me ? last.outer_grid.top : wrap.grid.bottom ),
								bottom: ( breakpoint && !breakpoint.default && next_clr_el_top ) ? next_clr_el_top.grid.top : wrap_bottom,
								left: wrap.grid.left,
								right: wrap_right,
								index: ( last_me ? 3 : 5 )
							},
							priority_index: 5,
							type: 'inside',
							insert: ['append', wrap.$el],
							region: region,
							is_me: last_me,
							is_clear: false,
							is_use: false,
							is_switch: false,
							switch_dir: false,
							row_wraps: false,
							me_in_row: false
						});
					//}
				}
				// Don't add another droppable if this is not the first el from wrapper, only on responsive
				if ( breakpoint && !breakpoint.default && has_siblings && sibling_index > 0 )
					return;
				// Add droppable before each wrapper that start in new line
				if ( !is_spacer && wrap_clr && !( is_wrap_me && ( !next_wrap || next_wrap_clr ) ) ){
					var top = ( wrap.grid.top == area.grid.top ) ? area.grid.top - 5 : current_full_top,
						el_top = ed.get_wrap_el_min(wrap, false, true),
						bottom = Math.ceil(el_top.grid_center.y),
						is_drop_me = ( prev_wrap_clr && is_prev_me && !has_siblings ),
						me_top = ( is_drop_me ? prev_wrap.grid.top : wrap.grid.top );
					if ( can_drop(me_top, el_top.grid.top-1) ){
						ed.drops.push({
							_id: ed._new_id(),
							top: top,
							bottom: bottom,
							left: area.grid.left,
							right: area.grid.right,
							priority: {
								top: me_top,
								bottom: min_row_el.grid.top-1,
								left: area.grid.left,
								right: area.grid.right,
								index: ( is_drop_me ? 2 : 3 )
							},
							priority_index: 8,
							type: 'full',
							insert: ['before', wrap.$el],
							region: region,
							is_me: is_drop_me,
							is_clear: true,
							is_use: false,
							is_switch: false,
							switch_dir: false,
							row_wraps: false,
							me_in_row: false
						});
						current_full_top = bottom+1;
					}
				}
				// Check to see if the right side on wrapper has enough column to add droppable
				if ( 
					( !is_spacer || ( is_spacer && wrap_me_in_row ) )
					&&
					( !next_wrap || next_wrap_clr )
					&&
					( !wrap_me_only || !wrap_clr )
					/*&&
					( 
						( !is_wrap_me && area.grid.right-wrap.grid.right >= min_col ) 
						|| 
						( wrap_me_only && !wrap_clr ) 
						|| 
						( prev_me_only && !wrap_clr && wrap_only ) 
					)*/
				){ // @TODO Experiment: always allow right side drop
					var is_switch = false,
						left = Math.ceil(wrap.grid_center.x)+1,
						right = ( !next_wrap || next_wrap_clr ) ? area.grid.right : wrap.grid.right,
						bottom = ( is_wrap_me && wrap.grid.bottom > max_row_wrap.grid.bottom ? wrap.grid.bottom : max_row_wrap.grid.bottom );
					if ( can_drop(wrap.grid.top, bottom) ){
						ed.drops.push({
							_id: ed._new_id(),
							top:  wrap.grid.top,
							bottom: bottom,
							left: ( wrap_me_only ? wrap.grid.left : left ),
							right: right,
							priority: {
								top: wrap.grid.top,
								bottom: bottom,
								left: ( wrap_me_only ? wrap.grid.left : left+Math.ceil((right-left)/2) ),
								right: right,
								index: ( wrap_me_only ? 1 : 4 )
							},
							priority_index: 10,
							type: 'side-after',
							insert: ['after', wrap.$el],
							region: region,
							is_me: wrap_me_only,
							is_clear: false,
							is_use: false,
							is_switch: is_switch,
							switch_dir: is_switch ? 'left' : false,
							row_wraps: row_wraps,
							me_in_row: ( wrap_me_in_row ? true : false )
						});
					}
				}
				// Now check the left side, finding spaces between wrapper and inner modules
				if ( 
					( !is_spacer || ( is_spacer && wrap_me_in_row ) )
					&&
					( !wrap_me_only || ( next_wrap && !next_wrap_clr ) )
					&&
					( wrap_clr || !prev_me_only )
					/*&&
					(
						( 
							//wrap_el_left.grid.left-wrap.grid.left >= min_col 
							//&&
							(!is_prev_me || wrap_clr) 
							&& 
							!is_wrap_me 
						) 
						|| 
						( is_wrap_me && next_wrap && !next_wrap_clr ) 
						|| 
						( is_prev_me && !wrap_clr && next_wrap && !next_wrap_clr ) 
						|| 
						( is_next_me && !next_wrap_clr ) 
					)*/
				){ // @TODO Experiment: always allow left side drop
					var is_switch_left = false,
						is_switch_right = false,
						left = ( prev_wrap && !wrap_clr ? Math.ceil(prev_wrap.grid_center.x)+1 : wrap.grid.left ),
						right = Math.ceil(wrap.grid_center.x),
						bottom = ( is_wrap_me && wrap.grid.bottom > max_row_wrap.grid.bottom ? wrap.grid.bottom : max_row_wrap.grid.bottom );
					if ( can_drop(wrap.grid.top, bottom) ){
						ed.drops.push({
							_id: ed._new_id(),
							top: wrap.grid.top,
							bottom: bottom,
							left: left,
							right: ( wrap_me_only && next_wrap_el_left ? next_wrap_el_left.grid.left-1 : right ), 
							priority: {
								top: wrap.grid.top,
								bottom: bottom,
								left: ( prev_wrap && !wrap_clr ? left+Math.ceil((prev_wrap.grid.right-left)/2) : left ),
								right: ( wrap_me_only && next_wrap_el_left ? next_wrap_el_left.grid.left-1 : wrap.grid.left+Math.ceil((right-wrap.grid.left)/2)-1 ),
								index: ( wrap_me_only ? 1 : 4 )
							},
							priority_index: 10,
							type: 'side-before',
							insert: [( is_switch_left ? 'after' : 'before' ), wrap.$el],
							region: region,
							is_me: wrap_me_only,
							is_clear: wrap_clr,
							is_use: false,
							is_switch: ( is_switch_left || is_switch_right ),
							switch_dir: ( is_switch_left ? 'left' : ( is_switch_right ? 'right' : false ) ),
							row_wraps: row_wraps,
							me_in_row: ( wrap_me_in_row ? true : false )
						});
					}
				}
			});

			// Don't add another droppable if this is not the first el from wrapper, only on responsive
			if ( breakpoint && !breakpoint.default && has_siblings && sibling_index > 0 ){
				return;
			}
			
			// If spacer, don't add further
			if ( is_spacer ) {
				return;
			}

			if ( $wraps.size() > 0 ) {
				var last_wrap = ed.get_wrap($wraps.last()),
					last_wrap_clr = ( last_wrap && last_wrap.grid.left == area.grid.left ),
					is_drop_me = ( me_wrap && last_wrap_clr && last_wrap._id == me_wrap._id && !has_siblings ),
					bottom = ( expand_lock ? area.grid.bottom : ( area.grid.bottom-current_full_top > row ? area.grid.bottom + 5 : current_full_top + row ) ),
					bottom_wrap = _.max(ed.wraps, function(each){
						if ( each.region != region_name )
							return 0;
						if ( me_wrap && me_wrap._id == each._id )
							return 0;
						if ( !_.contains($wraps.get(), each.$el.get(0)) )
							return 0;
						return each.grid.bottom;
					}),
					top = bottom_wrap.grid.bottom+1,
					bottom_not_me = ( !me_wrap || ( bottom_wrap && me_wrap && bottom_wrap._id != me_wrap._id ) ),
					priority_top = ( bottom_not_me && top > current_full_top ? top : current_full_top );
				if ( can_drop(priority_top, bottom) || is_drop_me ){
					ed.drops.push({
						_id: ed._new_id(),
						top: current_full_top,
						bottom: bottom,
						left: area.grid.left,
						right: area.grid.right,
						priority: {
							top: priority_top,
							bottom: bottom,
							left: area.grid.left,
							right: area.grid.right,
							index: ( is_drop_me ? 2 : 3 )
						},
						priority_index: 8,
						type: 'full',
						insert: ['append', $area],
						region: region,
						is_me: is_drop_me,
						is_clear: true,
						is_use: false,
						is_switch: false,
						switch_dir: false,
						row_wraps: false,
						me_in_row: false
					});
				}
			}
			else {
				var bottom = ( expand_lock ? area.grid.bottom : ( area.grid.bottom-area.grid.top > row ? area.grid.bottom : area.grid.top + row ) );
				if ( can_drop(area.grid.top, bottom) ){
					ed.drops.push({
						_id: ed._new_id(),
						top: area.grid.top,
						bottom: bottom,
						left: area.grid.left,
						right: area.grid.right,
						priority: null,
						priority_index: 8,
						type: 'full',
						insert: ['append', $area],
						region: region,
						is_me: ( region_name == 'shadow' && me.region == region_name ),
						is_clear: true,
						is_use: false,
						is_switch: false,
						switch_dir: false,
						row_wraps: false,
						me_in_row: false
					});
				}
			}
		});
		this.time_end('fn create_drop_point');
	},

	/**
	 * Update wrappers
	 */
	update_wrappers: function (parent_model, $parent) {
		this.time_start('fn update_wrappers');
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			wraps = parent_model.get('wrappers'),
			modules = parent_model.get('modules');
		($parent ? $parent : $layout).find('.upfront-wrapper').each(function(){
			var $wrap = $(this),
				wrap_id = $wrap.attr('id'),
				wrap_model = wraps.get_by_wrapper_id(wrap_id),
				clear = $wrap.data('clear'),
				children = _.map($wrap.children(), function (each) {
					var $el = $(each).hasClass('upfront-module-group') ? $(each) : $(each).find('>.upfront-editable_entity:first');
					if ( !$el || !$el.length ) return false;
					return $el;
				}).filter(function (each) {
					return each !== false;
				});
			;
			if ( children.length == 0 ){
				if ( wrap_model ) wraps.remove(wrap_model);
				return;
			}
			if ( $wrap.hasClass('upfront-wrapper-preview') ) return;
			if ( !$wrap.is(':visible') || $wrap.height() <= 0 ) return;
			if ( ! wrap_model ) return;
			var child_els = _.map(children, function($el){
					return {
						$el: $el,
						col: ( !breakpoint || breakpoint.default ) ? ed.get_class_num($el, ed.grid.class) : $el.data('breakpoint_col'),
						margin: $el.data('margin')
					};
				}),
				max = _.max(child_els, function(each){
					if ( !each ) return;
					return each.col + each.margin.current.left;
				}),
				wrap_col = max.col+max.margin.current.left,
				wrap_breakpoint, breakpoint_data;
			ed.update_class($wrap, ed.grid.class, wrap_col);
			if ( !breakpoint || breakpoint.default ){
				wrap_model.replace_class(ed.grid.class+wrap_col);
				if ( (clear && clear == 'clear') || (!clear && $wrap.hasClass('clr')) )
					wrap_model.add_class('clr');
				else
					wrap_model.remove_class('clr');
			}
			else {
				wrap_breakpoint = Upfront.Util.clone(wrap_model.get_property_value_by_name('breakpoint') || {});
				if ( !_.isObject(wrap_breakpoint[breakpoint.id]) )
					wrap_breakpoint[breakpoint.id] = {};
				wrap_breakpoint[breakpoint.id].col = wrap_col;
				if ( clear )
					wrap_breakpoint[breakpoint.id].clear = (clear == 'clear');
				wrap_model.set_property('breakpoint', wrap_breakpoint);
			}
			$wrap.stop().css({
				position: '',
				left: '',
				right: ''
			});
		});
		wraps.each(function(wrap){
			if ( $('#'+wrap.get_wrapper_id()).size() == 0 )
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
			$me = is_group ? view.$el : view.$el.find('.upfront-editable_entity:first'),
			is_parent_group = ( typeof view.group_view != 'undefined' ),
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			$resize, $resize_placeholder,
			axis
		;
		if ( Upfront.Application.mode.current !== Upfront.Application.MODE.THEME && model.get_property_value_by_name('disable_resize') ) {
			return false;
		}
		if ( $me.hasClass('upfront-module-spacer') ) {
			return false;
		}
		if ( $me.data('ui-resizable') ){
			$me.resizable('option', 'disabled', false);
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
				})
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
				ed.update_position_data();
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
				
				view.trigger('entity:resize_start', {row: me.row, col: me.col, height: me.height, width: me.width}, view, view.model);
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
					maxWidth: rsz_col*ed.col_size,
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
				
				view.trigger('entity:resizing', {row: rsz_row, col: rsz_col, height: rsz_row*ed.baseline, width: rsz_col*ed.col_size}, view, view.model);
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
					rsz_col = $me.data('resize-col'),
					rsz_row = $me.data('resize-row'),

					regions = app.layout.get('regions'),
					region = regions.get_by_name($region.data('name')),
					model_breakpoint, breakpoint_data
				;

				// Prevents quick scroll when resizing
				ed.resizing = false;

				$resize_placeholder.remove();
				$resize.remove();

				ed.update_class($me, ed.grid.class, rsz_col);
				if ( axis == 'nw' ){
					margin.current.left = margin.original.left - (rsz_col-prev_col);
					margin.current.top = margin.original.top - (rsz_row-prev_row);
					$me.data('margin', margin);
					ed.update_margin_classes($me);
				}
				else if ( axis == 'se' && wrap ){
					ed.adjust_affected_right(wrap, aff_els.right, [me], me.grid.left+rsz_col-1, true);
					if ( expand_lock )
						ed.adjust_affected_bottom(wrap, aff_els.bottom, [me], me.grid.top+rsz_row-1, true);
				}

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

				if ( !breakpoint || breakpoint.default ){
					model.set_property('row', rsz_row);
					// Also resize containing object if it's only one object
					var objects = model.get('objects');
					if ( objects && objects.length == 1 ){
						objects.each(function(object){
							object.set_property('row', rsz_row);
						});
					}

					// Update model value
					if ( axis == 'nw' ){
						model.replace_class([
							ed.grid.class+rsz_col,
							ed.grid.left_margin_class+margin.current.left,
							ed.grid.top_margin_class+margin.current.top,
						].join(' '));
					}
					else{
						model.replace_class(ed.grid.class+rsz_col);
						ed.update_model_margin_classes($region.find('.upfront-module, .upfront-module-group').not($me));
					}
				}
				else {
					model_breakpoint = Upfront.Util.clone(model.get_property_value_by_name('breakpoint') || {});
					if ( !_.isObject(model_breakpoint[breakpoint.id]) )
						model_breakpoint[breakpoint.id] = {};
					breakpoint_data = model_breakpoint[breakpoint.id];
					breakpoint_data.edited = true;
					breakpoint_data.row = rsz_row;
					breakpoint_data.col = rsz_col;
					if ( axis == 'nw' ){
						breakpoint_data.left = margin.current.left;
						breakpoint_data.top = margin.current.top;
					}
					else {
						ed.update_model_margin_classes($region.find('.upfront-module, .upfront-module-group').not($me));
					}
					model.set_property('breakpoint', model_breakpoint);
					// Also resize containing object if it's only one object
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
				}

				if ( is_parent_group )
					ed.update_wrappers(view.group_view.model, view.group_view.$el);
				else
					ed.update_wrappers(region, $region);

				// Let's normalize
				ed.update_position_data();
				ed.normalize(ed.els, ed.wraps);

				$me.removeData('resize-col');
				$me.removeData('resize-row');

				view.trigger('entity:resize_stop', {row: rsz_row, col: rsz_col, height: rsz_row*ed.baseline, width: rsz_col*ed.col_size}, view, view.model);
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
			regions = app.layout.get('regions'),
			region_model,
			col = col ? ( col > max.col ? max.col : col ) : me.col,
			row = row ? ( max.row && row > max.row ? max.row : row ) : me.row
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


		regions.each(function(reg){
			if ( reg.get('modules') == model.collection )
				region_model = reg;
		});
		ed.normalize(ed.els, ed.wraps);
		ed.update_position_data();
		if ( axis == 'nw' ){
			margin.current.left = margin.original.left - (col-me.col);
			margin.current.top = margin.original.top - (row-me.row);
			$me.data('margin', margin);
			ed.update_margin_classes($me);
		}
		else if ( axis == 'se' && wrap ){
			ed.adjust_affected_right(wrap, aff_els.right, [me], me.grid.left+col-1, true);
			if ( expand_lock )
				ed.adjust_affected_bottom(wrap, aff_els.bottom, [me], me.grid.top+row-1, true);
		}
		else if ( axis == 'all' ){
			var max_se = ed.get_max_size(me, ed.els, region, 'se'),
				col_se = col > max_se.col ? max_se.col : col,
				row_se = max_se.row ? ( row > max_se.row ? max_se.row : row ) : false;
			if ( wrap ){
				ed.adjust_affected_right(wrap, aff_els.right, [me], me.grid.left+col_se-1, true);
				if ( expand_lock && row_se )
					ed.adjust_affected_bottom(wrap, aff_els.bottom, [me], me.grid.top+row_se-1, true);
			}
			margin.current.left = margin.original.left - (col-col_se);
			if ( row_se )
				margin.current.top = margin.original.top - (row-row_se);
			$me.data('margin', margin);
			ed.update_margin_classes($me);
		}
		ed.update_class($me, ed.grid.class, col);
		ed.update_wrappers(region_model, region.$el);
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
				ed.grid.class+col,
				ed.grid.left_margin_class+margin.current.left,
				ed.grid.top_margin_class+margin.current.top
			].join(' '));
		}
		else{
			model.replace_class(ed.grid.class+col);
			ed.update_model_margin_classes($layout.find('.upfront-module, .upfront-module-group').not($me));
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
			also_child_els
		;
		if ( Upfront.Application.mode.current !== Upfront.Application.MODE.THEME && model.get_property_value_by_name('disable_resize') )
			return false;
		if ( $me.data('ui-resizable') ){
			$me.resizable('option', 'disabled', false);
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
				ed.start(view, model);

				// Prevents quick scroll when resizing
				ed.resizing = window.scrollY;

				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					me = ed.get_wrap($me),
					//margin = $me.data('margin'),
					data = $(this).data('ui-resizable'),
					$wrappers = Upfront.Util.find_sorted($me.parent(), '> .upfront-wrapper'),
					aff_els = ed.get_affected_els(me, ed.wraps, [], true),
					resize_limit = ed.get_resize_limit(aff_els, ed.containment),
					also_resize;
					
				axis = data.axis ? data.axis : 'e';
				max_col = me.col + ( axis == 'w' ? me.grid.left-resize_limit[0] : resize_limit[1]-me.grid.right );
				min_col = ed.min_col;
				also_min_col = ed.min_col;
				is_spacer = ( $me.find('> .upfront-module-view > .upfront-module-spacer').length > 0 );
				
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
				$also_resize = false;
				if ( axis == 'w' && me.outer_grid.left > ed.containment.grid.left ) {
					$also_resize = Upfront.Util.find_from_elements($wrappers, $me, '.upfront-wrapper', true).first();
				}
				else if ( axis == 'e' && me.outer_grid.right < ed.containment.grid.right ) {
					$also_resize = Upfront.Util.find_from_elements($wrappers, $me, '.upfront-wrapper', false).first();
				}
				if ( $also_resize && $also_resize.length ) {
					also_resize = ed.get_wrap($also_resize);
					also_is_spacer = ( $also_resize.find('> .upfront-module-view > .upfront-module-spacer').length > 0 );
					also_model = model.collection.get_by_wrapper_id($also_resize.attr('id'));
					also_view = Upfront.data.wrapper_views[also_model.cid];
					if ( !is_spacer && !also_is_spacer ) {
						max_col -= min_col;
					}
					else if ( is_spacer ) {
						max_col -= min_col;
						min_col = 0;
					}
					if ( also_is_spacer ) {
						also_min_col = 0;
					}
				}
				else {
					$also_resize = false;
					also_resize = false;
					also_model = false;
					also_view = false;
					also_is_spacer = false;
				}
				
				child_els = [];
				also_child_els = [];
				$me.find('> .upfront-module-view > .upfront-module, > .upfront-module-group').each(function () {
					var child_model = ed.get_el_model($(this)),
						child_view = Upfront.data.module_views[child_model.cid]
					;
					if ( !child_view ) return;
					child_els.push({
						view: child_view,
						el: ed.get_el($(this))
					});
				});
				if ( $also_resize ) {
					$also_resize.find('> .upfront-module-view > .upfront-module, > .upfront-module-group').each(function () {
						var child_model = ed.get_el_model($(this)),
							child_view = Upfront.data.module_views[child_model.cid]
						;
						if ( !child_view ) return;
						also_child_els.push({
							view: child_view,
							el: ed.get_el($(this))
						});
					});
				}
				
				$resize_placeholder = $('<div class="upfront-resize-placeholder"></div>');
				$resize_placeholder.css({
					width: (((also_resize ? also_resize.col + me.col : me.col)/ed.containment.col)*100) + '%',
					height: ui.originalSize.height,
					position: 'relative'
				});
				if ( breakpoint && !breakpoint.default ) {
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
				ed.update_position_data();
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
					child.view.trigger('entity:resize_start', {row: child.el.row, col: child.el.col, height: child.el.height, width: child.el.width}, child.view, child.view.model);
				});
				_.each(also_child_els, function (child) {
					child.view.trigger('entity:resize_start', {row: child.el.row, col: child.el.col, height: child.el.height, width: child.el.width}, child.view, child.view.model);
				});
				
				// Trigger main event
				view.trigger('entity:wrapper:resize_start', {row: me.row, col: me.col, height: me.height, width: me.width}, view, view.model);
				if ( also_view ) {
					also_view.trigger('entity:wrapper:resize_start', {row: also_resize.row, col: also_resize.col, height: also_resize.height, width: also_resize.width}, also_view, also_view.model);
				}
				Upfront.Events.trigger("entity:wrapper:resize_start", view, view.model, also_view, also_view.model);
			},
			resize: function(e, ui){
				var $region = $me.closest('.upfront-region'),
					me = ed.get_wrap($me),
					also_resize = ( $also_resize ? ed.get_wrap($also_resize) : false ),
					region = ed.get_region($region),
					current_col = Math.round(ui.size.width/ed.col_size),
					min_w = min_col*ed.col_size,
					w = ( current_col > max_col ? Math.round(max_col*ed.col_size) : ( min_w > ui.size.width ? min_w : ui.size.width ) ),
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
					maxWidth: rsz_col*ed.col_size,
				});
				
				// Trigger child events
				_.each(child_els, function (child) {
					child.view.trigger('entity:resizing', {row: child.el.row, col: rsz_col, height: child.el.height, width: rsz_col*ed.col_size}, child.view, child.view.model);
				});
				_.each(also_child_els, function (child) {
					child.view.trigger('entity:resizing', {row: child.el.row, col: also_col, height: child.el.height, width: also_col*ed.col_size}, child.view, child.view.model);
				});
				
				// Trigger main event
				view.trigger('entity:wrapper:resizing', {row: me.row, col: rsz_col, height: me.height, width: rsz_col*ed.col_size}, view, view.model);
				if ( also_view ) {
					also_view.trigger('entity:wrapper:resizing', {row: also_resize.row, col: also_col, height: also_resize.height, width: also_col*ed.col_size}, also_view, also_view.model);
				}
			},
			stop: function(e, ui){
				Upfront.Events.trigger("entity:wrapper:pre_resize_stop", view, view.model, ui);
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$region = $me.closest('.upfront-region'),
					me = ed.get_wrap($me),
					also_resize = ( $also_resize ? ed.get_wrap($also_resize) : false ),
					aff_els = ed.get_affected_els(me, ed.wraps, [], true),
					resize_limit = ed.get_resize_limit(aff_els, ed.containment),
					prev_col = Math.ceil(ui.originalSize.width/ed.col_size),
					rsz_col = $me.data('resize-col'),
					also_col = ( $also_resize ? $also_resize.data('resize-col') : 0 ),
					regions = app.layout.get('regions'),
					region = regions.get_by_name($region.data('name')),
					first_in_row = ( axis == 'w' && me.outer_grid.left == ed.containment.grid.left ),
					last_in_row = ( axis == 'e' && me.outer_grid.right == ed.containment.grid.right )
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
				if ( !also_model && ( first_in_row || last_in_row ) && max_col-rsz_col > 0 ) {
					view.add_spacer( ( first_in_row ? 'left' : 'right' ), max_col-rsz_col );
				}
				else {
					// Else if rsz_col is 0, remove model, otherwise update model
					if ( rsz_col > 0 ) {
						if ( breakpoint && !breakpoint.default ) {
							model.set_breakpoint_property('edited', true, true);
							model.set_breakpoint_property('col', rsz_col);
							_.each(child_els, function (child) {
								child.view.model.set_breakpoint_property('edited', true, true);
								child.view.model.set_breakpoint_property('col', rsz_col);
							});
						}
						else {
							model.replace_class(ed.grid.class+rsz_col);
							_.each(child_els, function (child) {
								child.view.model.replace_class(ed.grid.class+rsz_col);
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
							if ( breakpoint && !breakpoint.default ) {
								also_model.set_breakpoint_property('edited', true, true);
								also_model.set_breakpoint_property('col', also_col);
								_.each(also_child_els, function (child) {
									child.view.model.set_breakpoint_property('edited', true, true);
									child.view.model.set_breakpoint_property('col', also_col);
								});
							}
							else {
								also_model.replace_class(ed.grid.class+also_col);
								_.each(also_child_els, function (child) {
									child.view.model.replace_class(ed.grid.class+also_col);
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

				// Let's normalize
				ed.update_position_data();
				ed.normalize(ed.els, ed.wraps);

				$me.removeData('resize-col');
				if ( $also_resize ) {
					$also_resize.removeData('resize-col');
				}

				// Trigger child events
				_.each(child_els, function (child) {
					child.view.trigger('entity:resize_stop', {row: child.el.row, col: rsz_col, height: child.el.height, width: rsz_col*ed.col_size}, child.view, child.view.model);
				});
				_.each(also_child_els, function (child) {
					child.view.trigger('entity:resize_stop', {row: child.el.row, col: also_col, height: child.el.height, width: also_col*ed.col_size}, child.view, child.view.model);
				});
				
				// Trigger main event
				view.trigger('entity:wrapper:resize_stop', {row: me.row, col: rsz_col, height: me.height, width: rsz_col*ed.col_size}, view, view.model);
				view.trigger('entity:wrapper:resize', {col: rsz_col}, view, view.model);
				if ( also_view ) {
					also_view.trigger('entity:wrapper:resize_stop', {row: also_resize.row, col: also_col, height: also_resize.height, width: rsz_col*ed.col_size}, also_view, also_view.model);
					also_view.trigger('entity:wrapper:resize', {col: also_col}, also_view, also_view.model);
				}
				Upfront.Events.trigger("entity:wrapper:resize_stop", view, view.model, also_view, also_view.model, ui);
				Upfront.Events.trigger("entity:wrapper:resized", view, view.model, also_view, also_view.model);
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
			is_group = view.$el.hasClass('upfront-module-group'),
			$me = is_group ? view.$el : view.$el.find('.upfront-editable_entity:first'),
			is_parent_group = ( typeof view.group_view != 'undefined' ),
			is_disabled = ( is_parent_group && !view.group_view.$el.hasClass('upfront-module-group-on-edit') ),
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			drop_top, drop_left, drop_col, area_col,
			adjust_bottom = false
		;

		if ( Upfront.Application.mode.current !== Upfront.Application.MODE.THEME && model.get_property_value_by_name('disable_drag') )
			return false;
		if ( $me.data('ui-draggable') ){
			if ( is_group || !is_disabled )
				$me.draggable('option', 'disabled', false);
			return false;
		}

		function select_drop (drop) {
			ed.time_start('fn select_drop');
			if ( drop.is_use )
				return;
			var drop_move = typeof ed.drop == 'object' && !drop.is_me ? true : false;
			_.each(ed.drops, function(each){
				each.is_use = ( each._id == drop._id );
			});
			ed.drop = drop;

			if ( ed.show_debug_element ){
				$('.upfront-drop-view-current').removeClass('upfront-drop-view-current');
				$('#drop-view-'+drop._id).addClass('upfront-drop-view-current');
			}
			$('.upfront-drop').remove();
			var $drop = $('<div class="upfront-drop upfront-drop-use"></div>'),
				me = ed.get_el($me),
				drop_change = function () {
					Upfront.Events.trigger("entity:drag:drop_change", view, view.model);
				},
				$insert_rel = drop.type == 'inside' && !is_group ?  drop.insert[1].parent() : drop.insert[1],
				insert_order = drop.insert[1].data('breakpoint_order') || 0,
				ani_width = me.width,
				ani_height = me.height;
			switch ( drop.insert[0] ){
				case 'before':
					$drop.insertBefore($insert_rel);
					break;
				case 'after':
					$drop.insertAfter($insert_rel);
					break;
				case 'append':
					drop.insert[1].append($drop);
					insert_order = drop.insert[1].children().length;
					break;
			}
			$drop.css('order', insert_order);
			
			if ( drop.type == 'full' || drop.type == 'inside' ) {
				$drop.css('width', (drop.right-drop.left+1)*ed.col_size);
				// Add height too in case of full region drop
				if ( !drop.priority || drop.is_me ) {
					$drop.css('height', (drop.bottom-drop.top+1)*ed.baseline);
					if ( drop.is_me ) $drop.css('margin-top', $me.height()*-1);
				}
			}
			else if ( drop.type == 'side-before' || drop.type == 'side-after' ) {
				var pos = $insert_rel.position();
				$drop.css('height', (drop.bottom-drop.top+1)*ed.baseline);
				// If drop is current element, add width too
				if ( drop.is_me ){
					$drop.css('width', $me.width());
					if ( drop.type == 'side-before' ) $drop.css('margin-right', $me.width()*-1);
					else $drop.css('margin-left', $me.width()*-1);
				}
				$drop.css({
					position: 'absolute',
					top: pos.top,
					left: pos.left + ( drop.type == 'side-after' ? $insert_rel.width() : 0 )
				});
			}
			else if ( drop_move ) {
				drop_change();
			}
			ed.time_end('fn select_drop');
		}

		$me.draggable({
			revert: true,
			revertDuration: 0,
			zIndex: 100,
			helper: 'clone',
			disabled: is_disabled,
			cancel: '.upfront-entity_meta, .upfront-element-controls',
			distance: 10,
			appendTo: $main,
			iframeFix: true,
			start: function(e, ui){
				is_parent_group = ( typeof view.group_view != 'undefined' );
				ed.time_start('drag start');
				$main.addClass('upfront-dragging');
				// remove position which might be set to the module view
				$(this).closest(".upfront-module-view").css("position", "");
				ed.start(view, model);
				ed.normalize(ed.els, ed.wraps);
				ed.update_position_data();
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$helper = $('.ui-draggable-dragging'),
					$wrap = $me.closest('.upfront-wrapper'),
					$region = $me.closest('.upfront-region'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					me_offset = $me.offset(),
					max_height = ed.max_row*ed.baseline,
					draggable = $(this).data('ui-draggable'),
					cursor_top = e.pageY - me_offset.top,
					area = ( is_parent_group ? ed.get_el(view.group_view.$el) : ed.get_region($region) ),
					drop_areas = false;

				// hack the cursor position
				if ( cursor_top > max_height/2 ) {
					draggable._adjustOffsetFromHelper({
						top: ( me.height > max_height ? max_height : me.height )/2
					});
				}

				//$region.css('min-height', $region.css('height'));
				//$me.hide();
				$me.css('visibility', 'hidden');
				$helper.css('max-width', me.width);
				$helper.css('height', me.height);
				$helper.css('max-height', max_height);
				$helper.css('margin-left', $me.css('margin-left')); // fix error with the percentage margin applied

				if ( is_parent_group ) {
					drop_areas = [ area ];
				}
				else if ( breakpoint && !breakpoint.default ) {
					drop_areas = [ area ];
				}
				area_col = area.col;


				ed.create_drop_point(me, wrap, drop_areas);

				$wrap.css('min-height', '1px');

				$('.upfront-drop-me').css('height', (me.outer_grid.bottom-me.outer_grid.top)*ed.baseline);

				if ( ed.show_debug_element ){
					_.each(ed.els, function(each){
						each.$el.find(".upfront-debug-info").size() || each.$el.find('.upfront-editable_entity:first').append('<div class="upfront-debug-info"></div>');
						each.$el.find(".upfront-debug-info").text('grid: ('+each.grid.left+','+each.grid.right+'),('+each.grid.top+','+each.grid.bottom+') | outer: ('+each.outer_grid.left+','+each.outer_grid.right+'),('+each.outer_grid.top+','+each.outer_grid.bottom+') | center: '+each.grid_center.x+','+each.grid_center.y);
					});
					_.each(ed.drops, function(each){
						//each.$el.append('<div class="upfront-drop-debug">('+each.left+','+each.top+'),('+each.right+','+each.bottom+')</div>');
						var $view = $('<div class="upfront-drop-view"><div class="upfront-drop-priority-view"></div><span class="upfront-drop-view-pos"></span></div>');
						$view.addClass('upfront-drop-view-'+each.type);
						if ( each.is_me )
							$view.addClass('upfront-drop-view-me');
						$view.attr('id', 'drop-view-'+each._id);
						$view.css({
							top: (each.top-1)*ed.baseline,
							left: (each.left-1)*ed.col_size + (ed.grid_layout.left-ed.grid_layout.layout_left),
							width: (each.right-each.left+1) * ed.col_size,
							height: (each.bottom-each.top+1) * ed.baseline
						});
						if ( each.priority ){
							$view.find('.upfront-drop-priority-view').css({
								top: (each.priority.top-each.top)*ed.baseline,
								left: (each.priority.left-each.left)*ed.col_size,
								width: (each.priority.right-each.priority.left+1) * ed.col_size,
								height: (each.priority.bottom-each.priority.top+1) * ed.baseline
							});
						}
						$view.find('.upfront-drop-view-pos').text(
							'('+each.left+','+each.right+')'+'('+each.top+','+each.bottom+')'+'('+each.type+')' +
							( each.priority ? '('+each.priority.left+','+each.priority.right+')'+'('+each.priority.top+','+each.priority.bottom+')' : '' )
						);
						$layout.append($view);
					});
					$layout.append('<div id="upfront-compare-area"></div>');
					$helper.find(".upfront-debug-info").size() || $helper.append('<div class="upfront-debug-info"></div>');
				}/* */

				// Default drop to me
				select_drop( _.find(ed.drops, function(each){ return each.is_me; }) );
				$region.addClass('upfront-region-drag-active');

				ed.time_end('drag start');
				ed.time_start('drag start - trigger');
				Upfront.Events.trigger("entity:drag_start", view, view.model);
				ed.time_end('drag start');
			},
			drag: function(e, ui){
				//ed.time_start('dragging');
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$helper = $('.ui-draggable-dragging'),
					$wrap = $me.closest('.upfront-wrapper'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					
					is_spacer = $me.hasClass('upfront-module-spacer'),
					wrap_only = $wrap.find('> .upfront-module-view > .upfront-module, > .upfront-module-group').length == 1,

					move_region = !($me.closest('.upfront-region').hasClass('upfront-region-drag-active')),
					region,

					height = Math.ceil($helper.outerHeight()/ed.baseline)*ed.baseline,
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
					col = me.col,
					
					compare_col = ed.focus ? ed.focus_compare_col : ed.compare_col,
					compare_row = ed.focus ? ed.focus_compare_row : ed.compare_row,

					compare_area_top = grid.y-(compare_row/2),
					compare_area_top = compare_area_top < current_grid_top ? current_grid_top : compare_area_top,
					compare_area_left = grid.x-(compare_col/2),
					compare_area_left = compare_area_left < current_grid_left ? current_grid_left : compare_area_left,
					compare_area_right = compare_area_left+compare_col-1,
					compare_area_right = compare_area_right > current_grid_right ? current_grid_right : compare_area_right,
					compare_area_bottom = compare_area_top+compare_row-1,
					compare_area_bottom = compare_area_bottom > current_grid_bottom ? current_grid_bottom : compare_area_bottom,
					compare_area_bottom = compare_area_bottom > compare_area_top+ed.max_row ? compare_area_top+ed.max_row : compare_area_bottom,

					compare_area_position = [grid.x, grid.y, compare_area_top, compare_area_right, compare_area_bottom, compare_area_left], // to store as reference
					
					moved_distance = ed._last_coord ? Math.sqrt(Math.pow(e.pageX-ed._last_coord.x, 2) + Math.pow(e.pageY-ed._last_coord.y, 2)) : 0
				;

				if ( ed._last_drag_position && moved_distance <= ed.update_distance ){
					// Not moving much? Let's try to focus
					if ( Date.now() - ed._last_drag_time >= ed.focus_timeout ) {
						ed.focus = true;
						ed.focus_coord.x = e.pageX;
						ed.focus_coord.y = e.pageY;
						ed._last_drag_time = Date.now();
					}
					return;
				}
				ed._last_drag_position = compare_area_position;
				ed._last_coord = {x: e.pageX, y: e.pageY};
				ed._last_drag_time = Date.now();
				
				// If focused, try to see if we need to out focus it
				if ( ed.focus ) {
					var focus_distance = Math.sqrt(Math.pow(e.pageX-ed.focus_coord.x, 2) + Math.pow(e.pageY-ed.focus_coord.y, 2));
					if ( focus_distance > ed.focus_out_distance ) {
						ed.focus = false;
					}
				}


				//$helper.css('max-width', region.col*ed.col_size);

				// change drop point on timeout
				clearTimeout(ed._t);
				ed._t = setTimeout(update_drop_timeout, ed.timeout);
				
				function update_drop_timeout () {
					if ( !breakpoint || breakpoint.default ) {
						update_current_region();
					}
					else {
						set_current_region();
					}
					col = region.col; // Always set to region.col as we want full-width always
					update_current_drop();
				}

				function update_current_region () {
					// Finding the regions we currently on
					var $last_region_container = $('.upfront-region-container-wide, .upfront-region-container-clip').not('.upfront-region-container-shadow').last(),
						regions_area = _.map(ed.regions, function(each){
							var top, bottom, left, right, area,
								is_same_container = ( each.$el.closest('.upfront-region-container').get(0) == $last_region_container.get(0) ),
								region_bottom = ( is_same_container && ( !each.$el.hasClass('upfront-region-side') || each.$el.hasClass('upfront-region-side-left') || each.$el.hasClass('upfront-region-side-right') ) ) ? 999999 : each.grid.bottom, // Make this bottom-less if it's in the last region container,
								is_active = each.$el.hasClass('upfront-region-drag-active'),
								is_sub_h = each.$el.hasClass('upfront-region-side-top') || each.$el.hasClass('upfront-region-side-bottom'),
								area = get_area_compared({
									top: each.grid.top - 5,
									bottom: region_bottom + 5,
									left: each.grid.left,
									right: each.grid.right
								}),
								type = each.$el.data('type'),
								priority = ed.region_type_priority[type];
							area *= priority;
							if ( is_sub_h )
								area *= 2;
							if ( is_active )
								area *= 1.5;
							return {
								area: area,
								region: each
							};
						}),
						max_region = _.max(regions_area, function(each){ return each.area; });

					set_current_region( max_region.area > 0 ? max_region.region : false );

					if ( ed.show_debug_element ){
						_.each(regions_area, function(r){
							r.region.$el.find('>.upfront-debug-info').text(r.area);
						});
					}
				}

				function set_current_region (reg) {
					region = reg && reg.$el ? reg : ed.get_region($me.closest('.upfront-region'));

					if ( !region.$el.hasClass('upfront-region-drag-active') ){
						$('.upfront-region-drag-active').removeClass('upfront-region-drag-active');
						region.$el.addClass('upfront-region-drag-active');
					}
				}

				function update_current_drop () {
					var drops_area = _.map(ed.drops, function(each){
							if ( each.region._id != region._id )
								return false;
							var area = get_area_compared(each);
							return {
								area: area,
								drop: each
							};
						}).filter(function(each){
							if ( each !== false )
								return true;
							return false;
						}),
						max_drop = _.max(drops_area, function(each){ return each.area; });

					if ( max_drop.area > 0 ){
						var max_drops = _.filter(drops_area, function(each){ return each.area == max_drop.area; }),
							max_drops_sort = _.sortBy(max_drops, function(each, index, list){
								var priority_area = each.drop.priority ? get_area_compared(each.drop.priority) : 0;
								if ( priority_area*1 >= each.area )
									return each.drop.priority.index;
								return each.drop.priority_index;
							}),
							drop = _.first(max_drops_sort).drop;
					}
					else {
						/*if ( region.$el.find('.upfront-drop-me').size() > 0 ){
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
						}*/
						var drop = _.find(ed.drops, function(each){
							return each.is_me;
						});
					}
					select_drop(drop);
					update_drop_position();
				}

				function get_area_compared (compare) {
					var top, bottom, left, right, area;
					if ( compare_area_left >= compare.left && compare_area_left <= compare.right )
						left = compare_area_left;
					else if ( compare_area_left < compare.left )
						left = compare.left;
					if ( compare_area_right >= compare.left && compare_area_right <= compare.right )
						right = compare_area_right;
					else if ( compare_area_right > compare.right )
						right = compare.right;
					if ( compare_area_top >= compare.top && compare_area_top <= compare.bottom )
						top = compare_area_top;
					else if ( compare_area_top < compare.top )
						top = compare.top;
					if ( compare_area_bottom >= compare.top && compare_area_bottom <= compare.bottom )
						bottom = compare_area_bottom;
					else if ( compare_area_bottom > compare.bottom )
						bottom = compare.bottom;
					if ( top && bottom && left && right /*&& grid.x > 0 && grid.x <= ed.grid.size*/ )
						area = (right-left+1) * (bottom-top+1);
					else
						area = 0;
					return area ? area : 0;
				}

				function update_drop_position(){
					var drop_priority_top = ed.drop.priority ? ed.drop.priority.top-ed.drop.top : 0,
						drop_priority_left = ed.drop.priority ? ed.drop.priority.left-ed.drop.left : 0,
						expand_lock = ed.drop.region.$el.hasClass('upfront-region-expand-lock'),
						drop_row = ( ed.drop.priority ? ed.drop.priority.bottom-ed.drop.priority.top+1 : ed.drop.bottom-ed.drop.top+1 );
					drop_top = 0;
					drop_left = 0;
					// drop_col is calculated based of it's position
					if ( ed.drop.is_me || ( ed.drop.me_in_row && wrap_only ) || is_spacer ){
						drop_col = me.col;
					}
					else {
						if ( ed.drop.type == 'side-before' || ed.drop.type == 'side-after' ) {
							var distribute = ed._find_column_distribution(ed.drop.row_wraps, (ed.drop.me_in_row && wrap_only), true, area_col, false);
							drop_col = distribute.apply_col;
						}
						else {
							drop_col = ed.drop.priority ? ed.drop.priority.right-ed.drop.priority.left+1 : ed.drop.right-ed.drop.left+1;
						}
					}

					if ( is_group ) {
						var original_col = model.get_property_value_by_name('original_col');
						if ( _.isNumber(original_col) && original_col > col )
							col = original_col;
					}
					drop_col = drop_col <= col ? drop_col : col;

					//adjust_bottom = false;
					adjust_bottom = true;

					if ( ed.show_debug_element ){
						$('#upfront-compare-area').css({
							top: (compare_area_top-1) * ed.baseline,
							left: (compare_area_left-1) * ed.col_size + (ed.grid_layout.left-ed.grid_layout.layout_left),
							width: (compare_area_right-compare_area_left+1) * ed.col_size,
							height: (compare_area_bottom-compare_area_top+1) * ed.baseline
						}).text('('+compare_area_left+','+compare_area_right+') '+'('+compare_area_top+','+compare_area_bottom+')');
					}

				}

				update_drop_position();

				if ( ed.show_debug_element ){
					$helper.find(".upfront-debug-info").text('grid: '+grid.x+','+grid.y+' | current: ('+current_grid_left+','+current_grid_top+'),('+current_grid_right+','+current_grid_bottom+') | margin size: '+drop_top+'/'+drop_left);
				}

				//ed.time_end('dragging');
			},
			stop: function(e, ui){
				ed.time_start('drag stop');
				var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
					$wrap = $me.closest('.upfront-wrapper'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					wrap_els = wrap ? ed.get_wrap_els(wrap) : false,
					wrap_el_top = wrap ? ed.get_wrap_el_min(wrap, false, true) : false,
					col = me.col,
					$drop = $('.upfront-drop-use'),
					is_object = view.$el.find(".upfront-editable_entity:first").is(".upfront-object"),
					dropped = false,
					regions = app.layout.get("regions");
					region = regions.get_by_name( $('.upfront-region-drag-active').data('name') ),
					move_region = ( me.region != region.get('name') ),
					prev_region = regions.get_by_name( me.region ),
					wrappers = is_parent_group ? view.group_view.model.get('wrappers') : region.get('wrappers'),
					region_el = ed.get_region($('.upfront-region-drag-active')),
					prev_region_el = ed.get_region($me.closest('.upfront-region')),
					$container = is_parent_group ? view.group_view.$el.find('.upfront-editable_entities_container:first') : region_el.$el.find('.upfront-modules_container > .upfront-editable_entities_container:first'),
					$prev_container = prev_region_el.$el.find('.upfront-modules_container > .upfront-editable_entities_container:first'),
					module_selector = ".upfront-wrapper > .upfront-module-view > .upfront-module, .upfront-wrapper > .upfront-module-group",
					wrap_only = ( breakpoint && !breakpoint.default ? true : false )
				;

				clearTimeout(ed._t); // clear remaining timeout immediately

				if ( ed.drop.is_me ){
					update_margin();
					drop_update();
				}
				else {
					dropped = true;
					if ( !breakpoint || breakpoint.default ) {
						if ( ed.drop.type != 'inside' ){
							var wrapper_id = Upfront.Util.get_unique_id("wrapper");
								wrap_model = new Upfront.Models.Wrapper({
									"name": "",
									"properties": [
										{"name": "wrapper_id", "value": wrapper_id},
										{"name": "class", "value": ed.grid.class+drop_col}
									]
								}),
								wrap_view = new Upfront.Views.Wrapper({model: wrap_model});
							wrappers.add(wrap_model);
							if ( ed.drop.type == 'full' || ed.drop.is_clear ) {
								wrap_model.add_class('clr');
							}
							wrap_view.parent_view = view.parent_view;
							wrap_view.render();
							wrap_view.$el.append(view.$el);
							if ( ed.drop.type == 'side-before' && ed.drop.is_clear ) {
								$drop.nextAll('.upfront-wrapper').eq(0).removeClass('clr');
							}
							$drop.before(wrap_view.$el);
							Upfront.data.wrapper_views[wrap_model.cid] = wrap_view;
						}
						else {
							var $drop_wrap = $drop.closest('.upfront-wrapper'),
								wrapper_id = $drop_wrap.attr('id');
							$drop.before(view.$el);
						}
						if ( $wrap.find('> .upfront-module-view > .upfront-module, > .upfront-module-group').length == 0 ){
							if ( wrap && wrap.grid.left == region_el.grid.left ) {
								$wrap.nextAll('.upfront-wrapper').eq(0).addClass('clr');
							}
							$wrap.remove();
							wrap_only = true;
						}
					}
					update_margin();
					// var $me_drop_full = $('.upfront-drop-me.upfront-drop-wrap-full');
					// if ( $me_drop_full.size() > 0 && $('.upfront-drop').index($me_drop_full) < $('.upfront-drop').index($drop) ){
						// // animate the previous drop area for smooth transition
						// $('.upfront-region').css('min-height', '');
						// $me_drop_full.stop().animate({height: 0}, 1000, 'swing', function(){
							// drop_update();
						// });
					// }
					// else {
						drop_update();
					// }
				}

				function update_margin () {
					ed.time_start('fn update_margin');
					var margin_data = $me.data('margin'),
						aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [me], true) : ed.get_affected_els(me, ed.els, [me], true),
						move_limit = ed.get_move_limit(aff_els, ed.containment),
						rel_drop_top = ( ed.drop.priority ? ed.drop.priority.top : ed.drop.top ),
						drop_bottom = rel_drop_top+drop_top+me.row-1,
						bottom_els = aff_els.bottom.length > 0 ? _.filter(ed.els, function(each){
							return ( each.region == me.region && each._id != me._id && each.grid.bottom < aff_els.bottom[0].outer_grid.top );
						}) : [],
						bottom_el = bottom_els.length > 0 ? _.max(bottom_els, function(each){ return each.grid.bottom; }) : false,
						bottom_limit = 0,
						recalc_margin_x = false;

					if ( breakpoint && !breakpoint.default )
						adjust_bottom = false;

					// normalize clear
					_.each(ed.wraps, function(each){
						var breakpoint_clear = ( !breakpoint || breakpoint.default ) ? each.$el.hasClass('clr') : each.$el.data('breakpoint_clear');
						each.$el.data('clear', breakpoint_clear ? 'clear' : 'none');
					});

					if ( ed.drop.is_me ){
						bottom_limit = ( bottom_el !== false && bottom_el.grid.bottom > drop_bottom ? bottom_el.grid.bottom : drop_bottom );
						if ( margin_data.current.left != drop_left ){
							margin_data.current.left = drop_left;
							recalc_margin_x = true;
						}
						margin_data.current.top = drop_top;
						$me.data('margin', margin_data);
					}
					else { // Moved
						bottom_limit = ( bottom_el !== false && bottom_el.grid.bottom > me.outer_grid.top-1 ? bottom_el.grid.bottom : me.outer_grid.top-1 );
						margin_data.current.left = drop_left;
						margin_data.current.top = drop_top;

						if ( ed.drop.type == 'side-before' ){
							var $nx_wrap = ed.drop.insert[1];
							if ( $nx_wrap.size() > 0 ){
								var nx_wrap = ed.get_wrap($nx_wrap),
									need_adj = _.filter(ed.get_wrap_els(nx_wrap), function(each){
										return ( me.$el.get(0) != each.$el.get(0) && each.outer_grid.left == nx_wrap.grid.left );
									}),
									need_adj_min = ed.get_wrap_el_min(nx_wrap),
									nx_wrap_aff = ed.get_affected_wrapper_els(nx_wrap, ed.wraps, [], true),
									nx_wrap_clr = ( !breakpoint || breakpoint.default ) ? $nx_wrap.hasClass('clr') : $nx_wrap.data('breakpoint_clear');
								if ( ! nx_wrap_clr || ed.drop.is_clear ){
									//ed.adjust_els_right(need_adj, nx_wrap.grid.left+drop_col+drop_left-1);
									$nx_wrap.data('clear', 'none');
								}
							}
						}
						$me.data('margin', margin_data);
					}
					ed.time_end('fn update_margin');
				}

				function drop_update () {
					ed.time_start('fn drop_update');
					$('.upfront-drop').remove();
					$('.upfront-drop-view').remove();
					$('#upfront-compare-area').remove();

					/*ed.update_class($me, ed.grid.class, drop_col);
					( is_object ? ed.containment.$el.find('.upfront-object') : $container.find(module_selector) ).each(function(){
						ed.update_margin_classes($(this));
					});*/

					$me.css({
						'position': '',
						'top': '',
						'left': '',
						'z-index': '',
						'visibility': 'visible'
					});

					// Update model value
					//ed.update_model_margin_classes( ( is_object ? ed.containment.$el.find('.upfront-object') : $container.find(module_selector) ).not($me) );
					ed.update_model_margin_classes( $me, [ed.grid.class + drop_col] );
					
					// If the drop is to side, also update the elements inside
					if ( !ed.drop.is_me && ( !ed.drop.me_in_row || !wrap_only ) && ( ed.drop.type == 'side-before' || ed.drop.type == 'side-after' ) ) {
						var distribute = ed._find_column_distribution(ed.drop.row_wraps, false, true, area_col, false),
							remaining_col = distribute.remaining_col - (drop_col-distribute.apply_col);
						_.each(ed.drop.row_wraps, function (row_wrap) {
							row_wrap.$el.find("> .upfront-module-view > .upfront-module, > .upfront-module-group").each(function () {
								if ( $(this).hasClass('upfront-module-spacer') ) {
									var wrap_model = wrappers.get_by_wrapper_id(row_wrap.$el.attr('id')),
										this_model = ed.get_el_model($(this));
									wrappers.remove(wrap_model);
									model.collection.remove(this_model);
								}
								else {
									var apply_col = distribute.apply_col;
									// Distribute remaining_col
									if ( remaining_col > 0 ) {
										apply_col += 1;
										remaining_col -= 1;
									}
									ed.update_model_margin_classes( $(this), [ed.grid.class + apply_col] );	
								}
							});
						});
					}
					
					// Also try to distribute columns if the element was moved away and leave empty spaces in previous place
					if ( !ed.drop.is_me && !ed.drop.me_in_row && wrap_only ) {
						if ( ed.current_row_wraps && !_.isEqual(ed.drop.row_wraps, ed.current_row_wraps) ) {
							var distribute = ed._find_column_distribution(ed.current_row_wraps, true, false, area_col),
								remaining_col = distribute.remaining_col
							;
							if ( distribute.total > 0 ) {
								_.each(ed.current_row_wraps, function (row_wrap) {
									if ( wrap.$el.get(0) == row_wrap.$el.get(0) ) return;
									row_wrap.$el.find("> .upfront-module-view > .upfront-module, > .upfront-module-group").each(function () {
										if ( $(this).hasClass('upfront-module-spacer') ) return;
										var apply_col = distribute.apply_col;
										// Distribute remaining_col
										if ( remaining_col > 0 ) {
											apply_col += 1;
											remaining_col -= 1;
										}
										ed.update_model_margin_classes( $(this), [ed.grid.class + apply_col] );	
									});
								});
							}
							else if ( distribute.spacer_total > 0 ) {
								// Nothing to distribute, means all spacer, so we'll remove them
								_.each(ed.current_row_wraps, function (row_wrap) {
									if ( wrap.$el.get(0) == row_wrap.$el.get(0) ) return;
									row_wrap.$el.find("> .upfront-module-view > .upfront-module, > .upfront-module-group").each(function () {
										if ( !$(this).hasClass('upfront-module-spacer') ) return;
										var wrap_model = wrappers.get_by_wrapper_id(row_wrap.$el.attr('id')),
											this_model = ed.get_el_model($(this));
										wrappers.remove(wrap_model);
										model.collection.remove(this_model);
									});
								});
							}
						}
					}

					if ( is_parent_group ) {
						ed.update_wrappers(view.group_view.model, view.group_view.$el);
					}
					else {
						ed.update_wrappers(region, region_el.$el);
					}

					if ( move_region ) {
						ed.update_model_margin_classes( $prev_container.find(module_selector) );
						ed.update_wrappers(prev_region, prev_region_el.$el);
					}

					if ( !breakpoint || breakpoint.default ){
						if ( wrapper_id )
							model.set_property('wrapper_id', wrapper_id, true);

						if ( !move_region ){
							view.resort_bound_collection();
						}
						else {
							var modules = region.get('modules'),
								models = [];
							model.collection.remove(model, {silent: true});
							if ( model.get('shadow') ){
								view.trigger('on_layout');
								model.unset('shadow', {silent: true});
							}
							$me.removeAttr('data-shadow');
							$container.find(module_selector).each(function(){
								var element_id = $(this).attr('id'),
									each_model = modules.get_by_element_id(element_id);
								if ( !each_model && element_id == $me.attr('id') )
									models.push(model);
								else if ( each_model )
									models.push(each_model);
							});
							modules.reset(models);
						}
					}
					else {
						var orders = [],
							index = 0,
							is_drop_wrapper = ( ed.drop.type != 'inside' ),
							$els = Upfront.Util.find_sorted($container, (is_drop_wrapper ? '> .upfront-wrapper' : '.upfront-module')),
							inside_length = !is_drop_wrapper ? $me.closest('.upfront-wrapper').find('.upfront-module').length : 0,
							insert_index = false;
						if ( !ed.drop.is_me && ed.drop.insert[0] == 'append' && is_drop_wrapper ) {
							insert_index = $els.length-1;
						}
						$els.each(function(){
							var each_el = is_drop_wrapper ? ed.get_wrap($(this)) : ed.get_el($(this));
							if ( insert_index === index )
								index++;
							if ( !ed.drop.is_me && ed.drop.insert[0] == 'append' ) {
								if ( !is_drop_wrapper && insert_index === false && $(this).closest('.upfront-wrapper').get(0) == ed.drop.insert[1].get(0) ){
									insert_index = index + inside_length - 1;
								}
								if ( ( is_drop_wrapper && $wrap.get(0) == this ) || ( !is_drop_wrapper && $me.get(0) == this ) )
									index--;
							}
							if ( !ed.drop.is_me && ed.drop.insert[1].get(0) == this ){
								if ( ed.drop.insert[0] == 'before' ){
									insert_index = index;
									orders.push({
										$el: $(this),
										order: index+1,
										clear: ( ed.drop.type != 'side-before' )
									});
								}
								else if ( ed.drop.type == 'side-after' && ed.drop.insert[0] == 'after' ){
									insert_index = index+1;
									orders.push({
										$el: $(this),
										order: index,
										clear: ( each_el.outer_grid.left == region_el.grid.left )
									});
								}
								index++;
							}
							else {
								orders.push({
									$el: $(this),
									order: index,
									clear: ( each_el.outer_grid.left == region_el.grid.left )
								});
							}
							index++;
						});
						_.each(orders, function(each_el){
							var id = each_el.$el.attr('id'),
								each_model = is_drop_wrapper ? wrappers.get_by_wrapper_id(id) : ed.get_el_model(each_el.$el),
								model_breakpoint, model_breakpoint_data;
							if ( !each_model ) return;
							if ( ( is_drop_wrapper && each_el.$el.get(0) == $wrap.get(0) ) || ( !is_drop_wrapper && each_el.$el.get(0) == $me.get(0) ) ){
								each_el.order = insert_index !== false ? insert_index : each_el.order;
								each_el.clear = ed.drop.is_clear;
							}
							model_breakpoint = Upfront.Util.clone(each_model.get_property_value_by_name('breakpoint') || {});
							if ( !_.isObject(model_breakpoint[breakpoint.id]) ){
								model_breakpoint[breakpoint.id] = {};
							}
							model_breakpoint_data = model_breakpoint[breakpoint.id];
							model_breakpoint_data.order = each_el.order;
							model_breakpoint_data.edited = true;
							if ( is_drop_wrapper ) {
								model_breakpoint_data.clear = each_el.clear;
							}
							each_model.set_property('breakpoint', model_breakpoint);
						});
					}

					// Let's normalize
					ed.update_position_data();
					ed.normalize(ed.els, ed.wraps);

					// Add drop animation
					$me = is_group ? view.$el : view.$el.find('.upfront-editable_entity:first');
					$me.one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(){
						$(this).removeClass('upfront-dropped');
						Upfront.Events.trigger("entity:drag_animate_stop", view, view.model);
					}).addClass('upfront-dropped');

					$container.find('.upfront-module').css('max-height', '');
					$('.upfront-region-drag-active').removeClass('upfront-region-drag-active');
					$wrap.css('min-height', '');
					$main.removeClass('upfront-dragging');


					Upfront.Events.trigger("entity:drag_stop", view, view.model);
					if ( move_region ){
						view.region = region;
						view.region_view = Upfront.data.region_views[region.cid];
						if ( !_.isUndefined(view._modules_view) ) { // this is grouped modules, also fix the child views
							view._modules_view.region_view = view.region_view;
							if ( !_.isUndefined(model.get('modules')) ){
								model.get('modules').each(function(child_module){
									var child_view = Upfront.data.module_views[child_module.cid];
									if ( !child_view )
										return;
									child_view.region = view.region;
									child_view.region_view = view.region_view;
								});
							}
						}
						view.trigger('region:updated');
					}
					view.trigger("entity:drop", {col: drop_col, left: drop_left, top: drop_top}, view, view.model);
					view.trigger("entity:self:drag_stop");
					ed.time_end('fn drop_update');
				}

				// reset drop
				ed.drop = null;

				ed.time_end('drag stop');
			}
		});
	},
	
	_find_column_distribution: function (row_wraps, me_in_row, add, area_col, count_spacer) {
		var add = ( add !== false ),
			spacers = _.filter(row_wraps, function (row_wrap) {
				return ( row_wrap.$el.find('> .upfront-module-view > .upfront-module-spacer').length > 0 );
			}),
			spacers_col = _.reduce(spacers, function (sum, spacer) {
				return sum + spacer.col;
			}, 0),
			row_wraps_total = ( me_in_row ? row_wraps.length-1 : row_wraps.length ) - spacers.length,
			count_spacer = ( count_spacer !== false ),
			total_col = ( count_spacer ? area_col-spacers_col : area_col ),
			apply_col = 0,
			remaining_col = 0
		;
		if ( add ) row_wraps_total++;
		// If we have columns to distribute, else just return available col after spacer columns substracted (total_col)
		if ( row_wraps_total > 0 ) {
			apply_col = Math.floor(total_col/row_wraps_total);
			remaining_col = total_col - (apply_col*row_wraps_total);
		}
		else {
			apply_col = total_col;
			remaining_col = 0;
		}
		return {
			apply_col: apply_col,
			remaining_col: remaining_col,
			total_col: total_col,
			spacers_col: spacers_col,
			total: row_wraps_total,
			spacer_total: spacers.length
		}
	},

	toggle_draggables: function (enable) {
		$('.upfront-editable_entity.ui-draggable').draggable('option', 'disabled', (!enable));
	},

	/**
	 * Call this to normalize module placement on remove
	 */
	normalize_module_remove: function (view, module, modules, wrapper, wrappers) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			index = modules.indexOf(module),
			prev_module = modules.at(index-1),
			next_module = modules.at(index+1),
			next_module_class, next_module_left,
			prev_wrapper, prev_wrapper_class,
			next_wrapper, next_wrapper_class, next_wrapper_col
		;
		if (!next_module && !prev_module) return false;
		var module_class = module.get_property_value_by_name('class'),
			wrapper_class = wrapper.get_property_value_by_name('class'),
			wrapper_col = ed.get_class_num(wrapper_class, ed.grid.class),
			i = 0,
			split_prev = false,
			split_next = false,
			adjust_next = false,
			prev_modules = [],
			next_modules = [];
		if ( next_module ){
			next_module_class = next_module.get_property_value_by_name('class');
			next_module_left = ed.get_class_num(next_module_class, ed.grid.left_margin_class);
			next_wrapper = wrappers.get_by_wrapper_id(next_module.get_wrapper_id());
			next_wrapper_class = next_wrapper.get_property_value_by_name('class');
			next_wrapper_col = ed.get_class_num(next_wrapper_class, ed.grid.class);
			if ( !next_wrapper_class.match(/clr/g) ){
				/*next_wrapper.replace_class(
					ed.grid.class + (next_wrapper_col+wrapper_col) +
					( wrapper_class.match(/clr/g) ? ' clr' : '' )
				);
				adjust_next = true;*/ // @TODO Experiment: no adjusting next wrapper for now
				split_next = true;
			}
		}
		if ( prev_module ) {
			prev_wrapper = wrappers.get_by_wrapper_id(prev_module.get_wrapper_id());
			prev_wrapper_class = prev_wrapper.get_property_value_by_name('class');
			if ( prev_wrapper_class.match(/clr/g) && !split_next )
				split_prev = true;
		}
		// Adjust remaining modules in equal columns
		var all_modules = [],
			all_wrappers = [],
			spacer_wrappers = []
		;
		while ( modules.at(i) ) {
			var this_module = modules.at(i),
				this_module_class = this_module.get_property_value_by_name('class'),
				this_wrapper = wrappers.get_by_wrapper_id(this_module.get_wrapper_id()),
				this_wrapper_class = this_wrapper.get_property_value_by_name('class')
			;
			if ( i == 0 || this_wrapper_class.match(/clr/g) ) {
				if ( i > index ) break;
				all_wrappers = [];
				spacer_wrappers = [];
				all_modules = [];
			}
			if ( i == index ) {
				i++;
				continue;
			}
			if ( !_.contains(all_wrappers, this_wrapper) ) {
				all_wrappers.push(this_wrapper);
				if ( this_module_class.match(/upfront-module-spacer/) ) {
					spacer_wrappers.push(this_wrapper);
				}
			}
			all_modules.push(this_module);
			i++;
		}
		if ( all_wrappers.length >= 2 ) {
			split_next = false;
		}
		if ( !_.contains(all_wrappers, wrapper) ) {
			var total_col = wrapper_col,
				new_col = 0,
				remaining_col = 0;
			_.each(all_wrappers, function (each_wrapper) {
				if ( _.contains(spacer_wrappers, each_wrapper) ) return;
				var each_wrapper_class = each_wrapper.get_property_value_by_name('class'),
					each_wrapper_col = ed.get_class_num(each_wrapper_class, ed.grid.class)
				;
				total_col += each_wrapper_col;
			});
			if ( all_wrappers.length == spacer_wrappers.length ) {
				// All wrappers is spacers, just remove them as we don't need it anymore
				_.each(all_wrappers, function (each_wrapper, id) {
					_.each(all_modules, function (each_module) {
						if ( each_module.get_wrapper_id() == each_wrapper.get_wrapper_id() ) {
							modules.remove(each_module);
						}
					});
					wrappers.remove(each_wrapper);
				});
			}
			else {
				// Otherwise split columns evenly and ignore spacer columns
				new_col = Math.floor(total_col/(all_wrappers.length-spacer_wrappers.length));
				remaining_col = total_col - ((all_wrappers.length-spacer_wrappers.length) * new_col);
				// Apply the new col
				_.each(all_wrappers, function (each_wrapper, id) {
					if ( _.contains(spacer_wrappers, each_wrapper) ) return;
					var each_wrapper_class = each_wrapper.get_property_value_by_name('class'),
						apply_col =  new_col
					;
					// Distribute remaining_col
					if ( remaining_col > 0 ) {
						apply_col += 1;
						remaining_col -= 1;
					}
					each_wrapper.replace_class(
						ed.grid.class + apply_col +
						( id == 0 && !each_wrapper_class.match(/clr/g) ? ' clr' : '' )
					);
					_.each(all_modules, function (each_module) {
						if ( each_module.get_wrapper_id() == each_wrapper.get_wrapper_id() ) {
							each_module.replace_class(ed.grid.class + apply_col);
						}
					});
				});
			}
		}
		if ( split_prev || split_next ){
			var current_wrapper = false;
			_.each(( split_prev ? prev_modules : next_modules ), function (each_module, id) {
				var each_module_class = each_module.get_property_value_by_name('class'),
					each_module_left = ed.get_class_num(each_module_class, ed.grid.left_margin_class),
					each_module_col = ed.get_class_num(each_module_class, ed.grid.class),
					each_module_view = Upfront.data.module_views[each_module.cid],
					each_wrapper = wrappers.get_by_wrapper_id(each_module.get_wrapper_id()),
					each_wrapper_view = Upfront.data.wrapper_views[each_wrapper.cid],
					current_wrapper_view = current_wrapper ? Upfront.data.wrapper_views[current_wrapper.cid] : each_wrapper_view;
				if ( id > 0 ){
					var wrapper_id = Upfront.Util.get_unique_id("wrapper");
						wrap_model = new Upfront.Models.Wrapper({
							"name": "",
							"properties": [
								{"name": "wrapper_id", "value": wrapper_id},
								{"name": "class", "value": ed.grid.class+(each_module_left+each_module_col) + ' clr'}
							]
						}),
						wrap_view = new Upfront.Views.Wrapper({model: wrap_model});
					wrappers.add(wrap_model);
					wrap_view.parent_view = each_module_view.parent_view;
					wrap_view.render();
					wrap_view.$el.append(each_module_view.$el);
					current_wrapper_view.$el.after(wrap_view.$el);
					Upfront.data.wrapper_views[wrap_model.cid] = wrap_view;
					each_module.set_property('wrapper_id', wrapper_id, true);
					current_wrapper = wrap_model;
				}
			});
		}
	},

	/**
	 * Call this to adapt module to the breakpoint
	 */
	adapt_to_breakpoint: function (modules, wrappers, breakpoint_id, parent_col, silent) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			line_col = 0,
			line = -1;
			lines = [],
			modules_data = [],
			set_wrappers_col = {}, // keep track of set wrappers col
			silent = ( silent === true ) ? true : false,
			wrapper_index = 0
		;
		modules.each(function(module){
			var data = module.get_property_value_by_name('breakpoint'),
				module_class = module.get_property_value_by_name('class'),
				module_default_hide = module.get_property_value_by_name('default_hide'),
				module_hide = ( data[breakpoint_id] && "hide" in data[breakpoint_id] ) ? data[breakpoint_id].hide : module_default_hide,
				module_col = ed.get_class_num(module_class, ed.grid.class),
				wrapper = wrappers.get_by_wrapper_id(module.get_wrapper_id()),
				wrapper_data = wrapper && wrapper.get_property_value_by_name('breakpoint'),
				wrapper_class = wrapper && wrapper.get_property_value_by_name('class'),
				is_clear = wrapper && ( !!wrapper_class.match(/clr/) || line_col === 0 );
			if ( !wrapper )	return;
			if ( module_hide ) return;
			line_col += module_col; // Elements in a line have to fit the whole region now
			if ( line_col > parent_col ){
				is_clear = true;
			}
			if ( is_clear ){
				line_col = module_col; // Elements in a line have to fit the whole region now
				line++;
				lines[line] = [];
			}
			module_col = module_col > parent_col ? parent_col : module_col;
			lines[line].push({
				clear: is_clear,
				module: module,
				col: module_col,
				left: 0, // Elements in a line have to fit the whole region now
				wrapper: wrapper,
				breakpoint: Upfront.Util.clone( data || {} ),
				wrapper_breakpoint: Upfront.Util.clone( wrapper_data || {} )
			});
		});
		_.each(lines, function(line_modules){
			var line_col = _.map(line_modules, function(data){ 
					return data.col; // Elements in a line have to fit the whole region now
				}).reduce(function(sum, col){ 
					return sum + col;
				});
			_.each(line_modules, function(data, index){
				var new_col = 0,
					wrapper_col = 0;
				if ( ! _.isObject(data.breakpoint[breakpoint_id]) ) {
					data.breakpoint[breakpoint_id] = { edited: false };
				}
				if ( !_.isObject(data.wrapper_breakpoint[breakpoint_id]) ) {
					data.wrapper_breakpoint[breakpoint_id] = { edited: false };
				}
				if ( !data.breakpoint[breakpoint_id].edited ){
					// Elements in a line have to fit evenly the whole region now
					new_col = (line_col === parent_col) ? data.col : parent_col / line_modules.length;
					data.breakpoint[breakpoint_id].left = 0; 
					data.breakpoint[breakpoint_id].col = new_col;
					data.breakpoint[breakpoint_id].order = index;
					data.module.set_property('breakpoint', data.breakpoint, silent);
				}
				else {
					new_col = typeof data.breakpoint[breakpoint_id].col == 'number' ? data.breakpoint[breakpoint_id].col : data.col;
				}
				if ( !_.isUndefined(set_wrappers_col[data.wrapper.get_wrapper_id()]) ) {
					wrapper_col = set_wrappers_col[data.wrapper.get_wrapper_id()];
				}
				else {
					wrapper_index++;
				}
				if ( wrapper_col < new_col ) {
					wrapper_col = new_col;
					data.wrapper_breakpoint[breakpoint_id].col = wrapper_col;
					set_wrappers_col[data.wrapper.get_wrapper_id()] = wrapper_col;
					if ( !data.wrapper_breakpoint[breakpoint_id].edited ) {
						data.wrapper_breakpoint[breakpoint_id].order = wrapper_index-1;
						data.wrapper_breakpoint[breakpoint_id].clear = ( index === 0 );
					}
					data.wrapper.set_property('breakpoint', data.wrapper_breakpoint, silent);
				}
			});
		});
	},

	/**
	 * Call this to adapt region to the breakpoint
	 */
	adapt_region_to_breakpoint: function (regions, breakpoint_id, col, silent) {
		var app = Upfront.Application,
			ed = Upfront.Behaviors.GridEditor,
			default_breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default().toJSON();
			line_col = 0,
			silent = ( silent === true ) ? true : false;
		regions.each(function(region){
			var data = Upfront.Util.clone( region.get_property_value_by_name('breakpoint') || {} ),
				sub = region.get('sub');
			if ( !_.isObject(data[breakpoint_id]) )
				data[breakpoint_id] = { edited: false };
			if ( !data[breakpoint_id].edited ){
				if ( region.is_main() || ( !sub || sub.match(/^(left|right)$/) )  ){ 
					// Sidebar/main region, let's make the column to full width on responsive
					data[breakpoint_id].col = default_breakpoint.columns;
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
				var col = ed.get_class_num($me, ed.grid.class),
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
						var col = ed.get_class_num($me, ed.grid.class),
							$prev = $me.prevAll('.upfront-region:first'),
							$next = $me.nextAll('.upfront-region:first'),
							prev_col = $prev.size() > 0 ? ed.get_class_num($prev, ed.grid.class) : 0,
							next_col = $next.size() > 0 ? ed.get_class_num($next, ed.grid.class) : 0,
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
					if ( !breakpoint || breakpoint.default ){
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

				if ( !breakpoint || breakpoint.default ){
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
	 * Edit structure/grid
	 */
	edit_structure: function () {
		var ed = Upfront.Behaviors.GridEditor,
			app = Upfront.Application,
			grid = Upfront.Settings.LayoutEditor.Grid,
			$grid_wrap = $('<div class="upfront-edit-grid-wrap clearfix" />'),
			$recommended = $('<div class="upfront-edit-grid upfront-edit-grid-recommended" />'),
			$custom = $('<div class="upfront-edit-grid upfront-edit-grid-custom" />'),
			$color_wrap = $('<div class="upfront-edit-page-color" />'),
			$grid_width = $('<div class="upfront-grid-width-preview">Grid width: <span class="upfront-grid-width" /></div>'),
			$grid_width2 = $('<div class="upfront-grid-width-preview">( Grid width: <span class="upfront-grid-width" /> )</div>'),
			is_grid_custom = ( grid.column_width != grid.column_widths[grid.size_name] || grid.type_padding != grid.type_paddings[grid.size_name] || grid.baseline != grid.baselines[grid.size_name] || !(/^(0|5|10|15)$/.test(grid.column_padding)) ),
			update_grid_data = function() {
				var custom = fields.grid.get_value() == 'custom',
					new_grid = {
						column_width: custom ? fields.custom_width.get_value() : grid.column_widths[grid.size_name],
						column_padding: custom ? fields.custom_padding.get_value() : fields.recommended_padding.get_value(),
						baseline: custom ? fields.custom_baseline.get_value() : grid.baselines[grid.size_name],
						type_padding: custom ? fields.custom_type_padding.get_value() : grid.type_paddings[grid.size_name]
					},
					width = new_grid.column_width * grid.size;
				$grid_width.find('.upfront-grid-width').text(width + 'px');
				$grid_width2.find('.upfront-grid-width').text(width + 'px');
				ed.update_grid(new_grid);
			},
			togglegrid = new Upfront.Views.Editor.Command_ToggleGrid(),
			fields = {
				structure: new Upfront.Views.Editor.Field.Radios({
					label: Upfront.Settings.l10n.global.behaviors.structure,
					layout: "vertical",
					default_value: app.layout.get('layout_slug') || "blank",
					icon_class: 'upfront-structure-field-icon',
					values: [
						{label: "", value: "blank", icon: "blank"},
						{label: "", value: "wide", icon: "wide-no-sidebar"},
						{label: "", value: "wide-right-sidebar", icon: "wide-right-sidebar"},
						{label: "", value: "wide-left-sidebar", icon: "wide-left-sidebar"},
						{label: "", value: "clip", icon: "clip-no-sidebar"},
						{label: "", value: "clip-right-sidebar", icon: "clip-right-sidebar"},
						{label: "", value: "clip-left-sidebar", icon: "clip-left-sidebar"},
						{label: "", value: "full", icon: "full"},
						{label: "", value: "full-extended", icon: "full-extended"},
					],
					change: function(){
						if ( Upfront.themeExporter.currentTheme === 'upfront' ) {
							var structure = fields.structure.get_value(),
								layout_slug = app.layout.get('layout_slug');
							if ( (layout_slug && layout_slug != structure) || ( !layout_slug && structure != 'blank' ) ){
								app.layout.set('layout_slug', structure);
								if ( Upfront.Application.get_gridstate() )
									togglegrid.on_click();
								app.create_layout(_upfront_post_data.layout, {layout_slug: structure});
								Upfront.Events.once("layout:render", function() {
									if ( !Upfront.Application.get_gridstate() )
										togglegrid.on_click();
								});
							}
						}
					}
				}),
				grid: new Upfront.Views.Editor.Field.Radios({
					label: Upfront.Settings.l10n.global.behaviors.grid_settings,
					layout: "horizontal-inline",
					default_value: is_grid_custom ? "custom" : "recommended",
					values: [
						{label: Upfront.Settings.l10n.global.behaviors.recommended_settings, value: "recommended"},
						{label: Upfront.Settings.l10n.global.behaviors.custom_settings, value: "custom"}
					],
					change: function () {
						var value = this.get_value();
						if ( value == 'custom' ){
							$custom.show();
							$recommended.hide();
						}
						else {
							$recommended.show();
							$custom.hide();
						}
						update_grid_data();
					}
				}),
				recommended_padding: new Upfront.Views.Editor.Field.Select({
					default_value: grid.column_padding,
					values: [
						{label: Upfront.Settings.l10n.global.behaviors.padding_large, value: "15"},
						{label: Upfront.Settings.l10n.global.behaviors.padding_medium, value: "10"},
						{label: Upfront.Settings.l10n.global.behaviors.padding_small, value: "5"},
						{label: Upfront.Settings.l10n.global.behaviors.no_padding, value: "0"}
					],
					change: update_grid_data
				}),
				bg_color: new Upfront.Views.Editor.Field.Color({
					model: app.layout,
					label: Upfront.Settings.l10n.global.behaviors.page_bg_color,
					label_style: "inline",
					property: 'background_color',
					spectrum: {
						move: function (color) {
							var rgb = color.toRgb(),
							rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
							app.layout.set_property('background_color', rgba_string);
						}
					}
				}),
				custom_width: new Upfront.Views.Editor.Field.Number({
					label: Upfront.Settings.l10n.global.behaviors.column_width,
					label_style: "inline",
					min: 40,
					max: 100,
					default_value: grid.column_width,
					change: update_grid_data
				}),
				custom_padding: new Upfront.Views.Editor.Field.Number({
					label: Upfront.Settings.l10n.global.behaviors.column_padding,
					label_style: "inline",
					min: 0,
					max: 100,
					default_value: grid.column_padding,
					change: update_grid_data
				}),
				custom_baseline: new Upfront.Views.Editor.Field.Number({
					label: Upfront.Settings.l10n.global.behaviors.baseline_grid,
					label_style: "inline",
					min: 5,
					max: 100,
					default_value: grid.baseline,
					change: update_grid_data
				}),
				custom_type_padding: new Upfront.Views.Editor.Field.Number({
					label: Upfront.Settings.l10n.global.behaviors.additional_type_padding,
					label_style: "inline",
					min: 0,
					max: 100,
					default_value: grid.type_padding,
					change: update_grid_data
				}),
				floated: new Upfront.Views.Editor.Field.Checkboxes({
					multiple: false,
					default_value: true,
					values: [
						{label: Upfront.Settings.l10n.global.behaviors.allow_floats_outside_main_grid, value: true}
					]
				})
			};

		if ( !ed.structure_modal ){
			ed.structure_modal = new Upfront.Views.Editor.Modal({to: $('body'), button: true, top: 120, width: 540});
			ed.structure_modal.render();
			$('body').append(ed.structure_modal.el);
		}
		// Toggle grid on
		if ( !Upfront.Application.get_gridstate() )
			togglegrid.on_click();

		ed.structure_modal.open(function($content, $modal){
			$modal.addClass('upfront-structure-modal');
			_.each(fields, function(field){
				field.render();
				field.delegateEvents();
			});
			$content.html('');
			if (Upfront.themeExporter.currentTheme === 'upfront') {
				$content.append(fields.structure.el);
			}
			$content.append(fields.grid.el);
			$recommended.append(fields.recommended_padding.el);
			$recommended.append($grid_width);
			$grid_wrap.append($recommended);
			$custom.append(fields.custom_width.el);
			$custom.append($grid_width2);
			$custom.append(fields.custom_padding.el);
			$custom.append(fields.custom_baseline.el);
			$custom.append(fields.custom_type_padding.el);
			$color_wrap.append(fields.bg_color.el);
			$grid_wrap.append($custom);
			$grid_wrap.append($color_wrap);
			$content.append($grid_wrap);
			$content.append(fields.floated.el);
			fields.grid.trigger('changed');
		}, ed)
		.always(function(){
			if ( Upfront.Application.get_gridstate() )
				togglegrid.on_click();
		});
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
			breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().findWhere({id: current_bp_id}),
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

		if (flag_update_breakpoint && Upfront.Application.get_current() == Upfront.Settings.Application.MODE.THEME) {
			// Only do this in exporter, because that's where we're actually allowing structural changes.
			breakpoint.trigger("change:enabled", breakpoint);
		}
	},


	/**
	 * Apply saved grid in layout
	 */
	apply_grid: function () {
		var ed = Upfront.Behaviors.GridEditor,
			app = Upfront.Application,
			grid = Upfront.Settings.LayoutEditor.Grid,
			options = app.layout.get_property_value_by_name('grid');
		if ( !options || !options.column_widths || !options.column_widths[grid.size_name] )
			return;
		return ed.update_grid({
			column_width: options.column_widths[grid.size_name],
			column_padding: options.column_paddings[grid.size_name],
			baseline: options.baselines[grid.size_name],
			type_padding: options.type_paddings[grid.size_name]
		});
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
					$('.upfront-module.ui-draggable, .upfront-module-group.ui-draggable').draggable('option', 'delay', this.get_value());
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
					me.timeout = parseInt(this.get_value());
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

define(GridEditor);
	
})(jQuery);
//@ sourceURL=grid-editor.js
