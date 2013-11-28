(function ($) {

var LayoutEditor = {
	create_mergeable: function () {
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
		var app = this,
			models = [],
			region = app.layout.get("regions").active_region,
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
		Upfront.Application.layout_view.render();
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
	min_col: 3,
	max_row: 0,
	compare_col: 5,
	compare_row: 10,
	timeout: 67, // in ms
	_t: null, // timeout resource
	col_size: 0,
	baseline: 0,
	grid: null,
	
	els: [],
	wraps: [],
	regions: [],
	drops: [],
	
	drop: null,
	
	el_selector: '.upfront-module',
	_id: 0,
	
	show_debug_element: false,
	
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
			_id: ed._new_id(),
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
		var ed = Upfront.Behaviors.GridEditor,
			$els = use_wrap.$el.find(ed.el_selector);
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
				});
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
		if ( cmp_right+1 == ed.containment.grid.left && ed.get_wrap_els(adj_wrap).length == 0 ) {
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
		ed.el_selector = is_object ? '.upfront-object' : '.upfront-module';
		ed.main = {
			$el: $main,
			top: main_pos.top,
			bottom: main_pos.bottom,
			left: main_pos.left,
			right: main_pos.left + $main.outerWidth()
		};
		ed.grid_layout = {
			top: grid_layout_pos.top,
			bottom: grid_layout_pos.bottom,
			left: grid_layout_pos.left,
			right: grid_layout_pos.left + $grid_layout.outerWidth()
		};
		var containment_col = Math.round($containment.outerWidth()/ed.col_size),
			containment_row = Math.round($containment.outerHeight()/ed.baseline),
			containment_grid = ed.get_grid(containment_pos.left, containment_pos.top);
		ed.containment = {
			$el: $containment,
			top: containment_pos.top,
			bottom: containment_pos.bottom,
			left: containment_pos.left,
			right: containment_pos.left + $containment.outerWidth(),
			col: containment_col,
			grid: { 
				top: containment_grid.y,
				bottom: containment_grid.y+containment_row-1,
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
	create_drop_point: function (me, me_wrap) {
		var app = Upfront.Application.LayoutEditor,
			ed = Upfront.Behaviors.GridEditor,
			margin = me.$el.data('margin'),
			col = me.col,
			min_col = col > ed.min_col ? ed.min_col : col,
			row = me.row > ed.max_row ? ed.max_row : me.row;
		ed.drops = [];
		
		_.each(ed.regions, function(region){
			var $region = region.$el.find(".upfront-editable_entities_container:first"),
				region_name = region.$el.data('name'),
				$wraps = $region.find('> .upfront-wrapper'),
				current_full_top = region.grid.top;	
			$wraps.each(function(index){
				var $wrap = $(this),
					wrap = ed.get_wrap($wrap),
					wrap_clr = ( wrap.grid.left == region.grid.left ),
					is_wrap_me = ( me_wrap && wrap._id == me_wrap._id ),
					wrap_only = ( $wrap.find('.upfront-module').size() == 1 ),
					wrap_me_only = ( is_wrap_me && wrap_only ),
					$prev_wrap = $wraps[index-1] ? $wraps.eq(index-1) : false,
					prev_wrap = $prev_wrap ? ed.get_wrap($prev_wrap) : false,
					prev_wrap_clr = ( prev_wrap && prev_wrap.grid.left == region.grid.left ),
					is_prev_me = ( prev_wrap && me_wrap && prev_wrap._id == me_wrap._id ),
					prev_me_only = ( is_prev_me && $prev_wrap.find('.upfront-module').size() == 1 ),
					$next_wrap = $wraps[index+1] ? $wraps.eq(index+1) : false,
					next_wrap = $next_wrap ? ed.get_wrap($next_wrap) : false,
					next_wrap_clr = ( next_wrap && next_wrap.grid.left == region.grid.left ),
					is_next_me = ( next_wrap && me_wrap && next_wrap._id == me_wrap._id ),
					next_me_only = ( is_next_me && $next_wrap.find('.upfront-module').size() == 1 ),
					$next_clr = $wrap.nextAll('.upfront-wrapper.clr:first'),
					next_clr = $next_clr.size() > 0 ? ed.get_wrap($next_clr) : false,
					wrap_el_left = ed.get_wrap_el_min(wrap),
					next_wrap_el_top = next_wrap ? ed.get_wrap_el_min(next_wrap, false, true) : false,
					next_wrap_el_left = next_wrap ? ed.get_wrap_el_min(next_wrap) : false,
					next_clr_el_top = next_clr ? ed.get_wrap_el_min(next_clr, false, true) : false;
				if ( 
					( wrap.col >= min_col ) && (
					( next_wrap && !next_wrap_clr && !wrap_me_only && ( $next_wrap.find('.upfront-module').size() > 1 || !is_next_me ) ) || 
					( prev_wrap && !wrap_clr && !wrap_me_only && ( $prev_wrap.find('.upfront-module').size() > 1 || !is_prev_me ) ) || 
					( next_wrap && prev_wrap && !next_wrap_clr && !wrap_clr ) )
				){
					var current_el_top = wrap.grid.top;
					$els = $wrap.find('.upfront-module');
					$els.each(function(i){
						if ( $(this).get(0) == me.$el.get(0) )
							return;
						var $el = $(this),
							el = ed.get_el($el),
							top = ( el.outer_grid.top == wrap.grid.top ) ? wrap.grid.top : current_el_top,
							bottom = el.grid_center.y,
							$prev = $els[i-1] ? $els.eq(i-1) : false,
							prev = $prev ? ed.get_el($prev) : false,
							prev_me = ( prev && prev._id == me._id );
						ed.drops.push({
							_id: ed._new_id(),
							top: top,
							bottom: bottom,
							left: wrap.grid.left,
							right: wrap.grid.right,
							priority: {
								top: ( prev_me ? prev.outer_grid.top : el.outer_grid.top ),
								bottom: el.grid.top,
								left: wrap.grid.left,
								right: wrap.grid.right,
								index: 5
							},
							priority_index: 5,
							type: 'inside',
							insert: ['before', $el],
							region: region,
							is_me: prev_me,
							is_clear: false,
							is_use: false,
							is_switch: false
						});
						current_el_top = bottom+1;
					});
					if ( next_wrap_clr ){
						var wrap_bottom = next_wrap.grid.top-1;
					}
					else {
						if ( next_clr )
							var wrap_bottom = next_clr_el_top.grid.top-1;
						else
							var wrap_bottom = region.grid.bottom;
					}
					var $last = $els.last(),
						last = $last.size() > 0 ? ed.get_el($last) : false,
						last_me = ( last && last._id == me._id );
					ed.drops.push({
						_id: ed._new_id(),
						top: current_el_top,
						bottom: wrap_bottom,
						left: wrap.grid.left,
						right: wrap.grid.right,
						priority: {
							top: ( last_me ? last.outer_grid.top : wrap.grid.bottom ),
							bottom: wrap_bottom,
							left: wrap.grid.left,
							right: wrap.grid.right,
							index: 5
						},
						priority_index: 5,
						type: 'inside',
						insert: ['append', wrap.$el],
						region: region,
						is_me: last_me,
						is_clear: false,
						is_use: false,
						is_switch: false
					});
				}
				// Add droppable before each wrapper that start in new line
				if ( wrap_clr && !( is_wrap_me && ( !next_wrap || next_wrap_clr ) ) ){
					var top = ( wrap.grid.top == region.grid.top ) ? region.grid.top : current_full_top,
						el_top = ed.get_wrap_el_min(wrap, false, true),
						bottom = el_top.grid_center.y,
						is_drop_me = ( prev_wrap_clr && is_prev_me );
					ed.drops.push({
						_id: ed._new_id(),
						top: top,
						bottom: bottom,
						left: region.grid.left,
						right: region.grid.right,
						priority: {
							top: ( is_drop_me ? prev_wrap.grid.top : wrap.grid.top ),
							bottom: el_top.grid.top,
							left: region.grid.left,
							right: region.grid.right,
							index: 10
						},
						priority_index: 10,
						type: 'full',
						insert: ['before', wrap.$el],
						region: region,
						is_me: is_drop_me,
						is_clear: true,
						is_use: false,
						is_switch: false
					});
					current_full_top = bottom+1;
				}
				// Check to see if the right side on wrapper has enough column to add droppable
				if ( ( !next_wrap || next_wrap_clr ) && ( ( !is_wrap_me && region.grid.right-wrap.grid.right > min_col ) || ( wrap_me_only && !wrap_clr ) || ( prev_me_only && !wrap_clr && wrap_only ) ) ){
					var is_switch = ( prev_me_only && !wrap_clr && wrap_only );
					ed.drops.push({
						_id: ed._new_id(),
						top: wrap.grid.top,
						bottom: ( is_wrap_me || is_switch ? ( next_wrap_el_top ? next_wrap_el_top.grid.top-1 : region.grid.bottom ) : wrap.grid.bottom ),
						left: ( is_wrap_me ? wrap.grid.left : ( is_switch ? wrap_el_left.grid.left : wrap.grid.right+1 ) ),
						right: region.grid.right,
						priority: null,
						priority_index: 8,
						type: 'side-after',
						insert: ['after', wrap.$el],
						region: region,
						is_me: is_wrap_me,
						is_clear: false,
						is_use: false,
						is_switch: is_switch
					});
				}
				// Now check the left side, finding spaces between wrapper and inner modules
				if ( ( wrap_el_left.grid.left-wrap.grid.left >= min_col && (!is_prev_me || wrap_clr) && !is_wrap_me ) || ( wrap_me_only && next_wrap && !next_wrap_clr ) || ( next_me_only && !next_wrap_clr && wrap_only ) ){
					var is_switch = ( next_me_only && !next_wrap_clr && wrap_only ),
						right = wrap_el_left.grid.left > wrap.grid.left+col ? wrap_el_left.grid.left-1 : wrap.grid.left+col-1;
						bottom = next_clr_el_top ? next_clr_el_top.grid.top-1 : region.grid.bottom;
					ed.drops.push({
						_id: ed._new_id(),
						top: wrap.grid.top,
						bottom: bottom,
						left: wrap.grid.left,
						right: ( is_wrap_me ? next_wrap_el_left.grid.left-1 : ( is_switch ? wrap.grid.right : right ) ),
						priority: {
							top: wrap.grid.top,
							bottom: bottom,
							left: wrap.grid.left,
							right: ( is_wrap_me ? next_wrap_el_left.grid.left-1 : wrap_el_left.grid.left-1 ),
							index: 3
						},
						priority_index: 7,
						type: 'side-before',
						insert: ['before', wrap.$el],
						region: region,
						is_me: is_wrap_me,
						is_clear: wrap_clr,
						is_use: false,
						is_switch: is_switch
					});
				}
			});
			if ( $wraps.size() > 0 ) {
				var last_wrap = ed.get_wrap($wraps.last()),
					last_wrap_clr = ( last_wrap && last_wrap.grid.left == region.grid.left ),
					is_drop_me = ( me_wrap && last_wrap_clr && last_wrap._id == me_wrap._id ),
					bottom = ( region.grid.bottom-current_full_top > row ? region.grid.bottom : current_full_top + row ),
					bottom_wrap = _.max(ed.wraps, function(each){
						if ( each.region != region_name )
							return 0;
						return each.grid.bottom;
					});
				ed.drops.push({
					_id: ed._new_id(),
					top: current_full_top,
					bottom: bottom,
					left: region.grid.left,
					right: region.grid.right,
					priority: {
						top: ( is_drop_me ? last_wrap.grid.top : bottom_wrap.grid.bottom ),
						bottom: bottom,
						left: region.grid.left,
						right: region.grid.right
					},
					priority_index: 10,
					type: 'full',
					insert: ['append', $region],
					region: region,
					is_me: is_drop_me,
					is_clear: true,
					is_use: false,
					is_switch: false
				});
			}
			else {
				ed.drops.push({
					_id: ed._new_id(),
					top: region.grid.top,
					bottom: ( region.grid.bottom-region.grid.top > row ? region.grid.bottom : region.grid.top + row ),
					left: region.grid.left,
					right: region.grid.right,
					priority: null,
					priority_index: 10,
					type: 'full',
					insert: ['append', $region],
					region: region,
					is_me: ( region_name == 'shadow' && me.region == region_name ),
					is_clear: true,
					is_use: false,
					is_switch: false
				});
			}
		});
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
			ed.update_class($wrap, ed.grid.class, wrap_col);
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
			drop_top, drop_left, drop_col
		;
		if ( model.get_property_value_by_name('disable_drag') === 1 )
			return false;
		if ( $me.hasClass('ui-draggable') )
			return false;
		
		function select_drop (drop) {
			if ( drop.is_use )
				return;
			_.each(ed.drops, function(each){
				each.is_use = ( each._id == drop._id );
			});
			ed.drop = drop;
			
			if ( ed.show_debug_element ){
				$('.upfront-drop-view-current').removeClass('upfront-drop-view-current');
				$('#drop-view-'+drop._id).addClass('upfront-drop-view-current');
			}
			$('.upfront-drop').removeClass('upfront-drop-use').animate({height: 0}, 300, function(){ $(this).remove(); });
			_.each(ed.drops, function(each){
				if ( each.is_switch )
					each.insert[1].animate({left: 0}, 300);
			});
			var $drop = $('<div class="upfront-drop upfront-drop-use"></div>'),
				me = ed.get_el($me);
			switch ( drop.insert[0] ){
				case 'before':
					$drop.insertBefore( drop.type == 'inside' ? drop.insert[1].parent() : drop.insert[1] );
					break;
				case 'after':
					$drop.insertAfter( drop.type == 'inside' ? drop.insert[1].parent() : drop.insert[1] );
					break;
				case 'append':
					drop.insert[1].append($drop);
					break;
			}
			if ( ( drop.type == 'full' || drop.type == 'inside' || ( drop.type == 'side-after' && !drop.is_switch ) ) && !drop.is_me )
				$drop.css('width', (drop.right-drop.left+1)*ed.col_size).css('max-height', ed.max_row*ed.baseline).animate({height: me.height}, 300, 'swing', drop_change);
			else if (  drop.type == 'side-before' && drop.is_switch )
				drop.insert[1].animate({left: me.width}, 300, 'swing', drop_change);
			else if (  drop.type == 'side-after' && drop.is_switch )
				drop.insert[1].animate({left: me.width*-1}, 300, 'swing', drop_change);
			function drop_change () {
				Upfront.Events.trigger("entity:drag:drop_change", view, view.model);
			}
		}
		
		$me.draggable({
			revert: true,
			revertDuration: 0,
			zIndex: 100,
			helper: 'clone',
			delay: 100,
			appendTo: $main,
			start: function(e, ui){
				$main.addClass('upfront-dragging');
				
				ed.start(view, model);
				ed.normalize(ed.els, ed.wraps);
				var $helper = $('.ui-draggable-dragging'),
					$wrap = $me.closest('.upfront-wrapper'),
					$region = $me.closest('.upfront-region'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
					me_offset = $me.offset();
				$region.css('min-height', $region.css('height'));
				//$me.hide();
				$me.css('visibility', 'hidden');
				$helper.css('max-width', me.width);
				$helper.css('height', me.height);
				$helper.css('max-height', ed.max_row*ed.baseline);
				ed.create_drop_point(me, wrap);
				
				$wrap.css('min-height', '1px');
				
				$('.upfront-drop-me').css('height', (me.outer_grid.bottom-me.outer_grid.top)*ed.baseline);
				
				$layout.append( '<div id="upfront-drop-preview" style="top:' + me_offset.top + 'px; left: ' + me_offset.left + 'px;"></div>' );
				$('#upfront-drop-preview').addClass('upfront-drop-transition');
				
				/* */
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
							left: (each.left-1)*ed.col_size + (ed.grid_layout.left-ed.main.left),
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
						$view.find('.upfront-drop-view-pos').text('('+each.left+','+each.right+')'+'('+each.top+','+each.bottom+')');
						$layout.append($view);
					});
					$layout.append('<div id="upfront-compare-area"></div>');
					$helper.find(".upfront-debug-info").size() || $helper.append('<div class="upfront-debug-info"></div>');
				}/* */
				
				
				// Default drop to me
				select_drop( _.find(ed.drops, function(each){ return each.is_me; }) );
				$region.addClass('upfront-region-drag-active');
				
				Upfront.Events.trigger("entity:drag_start", view, view.model);
			},
			drag: function(e, ui){
				var $helper = $('.ui-draggable-dragging'),
					$wrap = $me.closest('.upfront-wrapper'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap),
									
					move_region = !($me.closest('.upfront-region').hasClass('upfront-region-drag-active')),
					region,
					
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
					
					compare_area_top = grid.y-(ed.compare_row/2),
					compare_area_top = compare_area_top < current_grid_top ? current_grid_top : compare_area_top,
					compare_area_left = grid.x-(ed.compare_col/2),
					compare_area_left = compare_area_left < current_grid_left ? current_grid_left : compare_area_left,
					compare_area_right = compare_area_left+ed.compare_col-1,
					compare_area_right = compare_area_right > current_grid_right ? current_grid_right : compare_area_right,
					compare_area_bottom = compare_area_top+ed.compare_row-1,
					compare_area_bottom = compare_area_bottom > current_grid_bottom ? current_grid_bottom : compare_area_bottom,
					compare_area_bottom = compare_area_bottom > compare_area_top+ed.max_row ? compare_area_top+ed.max_row : compare_area_bottom
				;
				
				//console.log([grid.x, grid.y, compare_area_top, compare_area_right, compare_area_bottom, compare_area_left]);
				
				
				//$helper.css('max-width', region.col*ed.col_size);
				
				clearTimeout(ed._t);
				ed._t = setTimeout(function(){
					update_current_region();
					col = col > region.col ? region.col : col;
					update_current_drop();
				}, ed.timeout);
				
				function update_current_region () {
					// Finding the regions we currently on
					var $last_region_container = $('.upfront-region-container:not(.upfront-region-container-shadow):last'),
						regions_area = _.map(ed.regions, function(each){
							var top, bottom, left, right, area,
								region_bottom = ( each.$el.closest('.upfront-region-container').get(0) == $last_region_container.get(0) ) ? 999999 : each.grid.bottom; // Make this bottom-less if it's in the last region container
							var area = get_area_compared({
								top: each.grid.top,
								bottom: region_bottom,
								left: each.grid.left,
								right: each.grid.right
							});
							if ( each.$el.hasClass('upfront-region-drag-active') )
								area *= 1.2;
							return {
								area: area,
								region: each
							};
						}),
						max_region = _.max(regions_area, function(each){ return each.area; });
					
					region = max_region.area > 0 ? max_region.region : ed.get_region($me.closest('.upfront-region'));
					
					_.each(regions_area, function(r){
						r.region.$el.find('>.upfront-debug-info').text(r.area);
					});
					
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
								if ( priority_area*2 > each.area )
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
					if ( top && bottom && left && right && grid.x > 0 && grid.x <= ed.grid.size )
						area = (right-left+1) * (bottom-top+1);
					else
						area = 0;
					return area;
				}
				
				function update_drop_position(){
					var drop_priority_top = ed.drop.priority ? ed.drop.priority.top-ed.drop.top : 0;
					drop_top = current_grid_top > (ed.drop.top+drop_priority_top) ? current_grid_top-ed.drop.top-drop_priority_top : 0;
					drop_left = current_grid_left > ed.drop.left ? current_grid_left-ed.drop.left : 0;
					drop_col = ed.drop.priority && !ed.drop.is_switch ? ed.drop.priority.right-ed.drop.priority.left+1 : ed.drop.right-ed.drop.left+1;
					
					if ( drop_col <= col && ed.drop.priority && !ed.drop.is_switch ){
						drop_left = ed.drop.priority.left+drop_left+drop_col-1 < ed.drop.priority.right ? drop_left : ed.drop.priority.right-drop_col-ed.drop.priority.left+1;
					}
					else {
						drop_col = drop_col <= col ? drop_col : col;
						drop_left = ed.drop.left+drop_left+drop_col-1 < ed.drop.right ? drop_left : ed.drop.right-drop_col-ed.drop.left+1;
					}
					
					$('#upfront-drop-preview').css({
						top: (ed.drop.top+drop_priority_top+drop_top-1) * ed.baseline,
						left: (ed.drop.left+drop_left-1) * ed.col_size + (ed.grid_layout.left-ed.main.left),
						width: drop_col*ed.col_size,
						height: height
					});
					
					if ( ed.show_debug_element ){
						$('#upfront-compare-area').css({
							top: (compare_area_top-1) * ed.baseline,
							left: (compare_area_left-1) * ed.col_size + (ed.grid_layout.left-ed.main.left),
							width: (compare_area_right-compare_area_left+1) * ed.col_size,
							height: (compare_area_bottom-compare_area_top+1) * ed.baseline
						}).text('('+compare_area_left+','+compare_area_right+') '+'('+compare_area_top+','+compare_area_bottom+')');
					}
					
				}
				
				update_drop_position();
				
				
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
					move_region = ( me.region != region.get('name') ),
					region_el = ed.get_region($('.upfront-region-drag-active'));
				
				clearTimeout(ed._t); // clear remaining timeout immediately
				
				if ( ed.drop.is_me ){
					update_margin();
					drop_update();
				}
				else {
					dropped = true;
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
						if ( ed.drop.type == 'full' || ed.drop.is_clear )
							wrap_model.add_class('clr');
						wrap_view.render();
						wrap_view.$el.append(view.$el);
						if ( ed.drop.type == 'side-before' && ed.drop.is_clear )
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
						if ( wrap && wrap.grid.left == region_el.grid.left )
							$wrap.nextAll('.upfront-wrapper').eq(0).addClass('clr');
						$wrap.remove();
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
					var margin_data = $me.data('margin'),
						aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
						move_limit = ed.get_move_limit(aff_els, ed.containment),
						recalc_margin_x = false;
					
					if ( ed.drop.is_me ){
						if ( margin_data.current.left != drop_left ){
							margin_data.current.left = drop_left;
							recalc_margin_x = true;
						}
						margin_data.current.top = drop_top;
						$me.data('margin', margin_data);
						
						// Recalculate margin so the affected elements remain in their position
						if ( recalc_margin_x ){
							if ( wrap )
								ed.adjust_affected_right(wrap, aff_els.right, [me], move_limit[0]+drop_col+drop_left-1);
							//else
							//	ed.adjust_els_right(aff_els.right, move_limit[0]+drop_col+drop_left-1);
						}
					}
					else { // Moved
						// normalize clear
						_.each(ed.wraps, function(each){
							each.$el.data('clear', (each.$el.hasClass('clr') ? 'clear' : 'none'));
						});
						if ( wrap && !ed.drop.is_switch )
							ed.adjust_affected_right(wrap, aff_els.right, [me], wrap.grid.left-1);
					//	else
					//		ed.adjust_els_right(aff_els.right, me.grid.left-1);
						margin_data.current.left = drop_left;
						margin_data.current.top = drop_top;
						margin_data.current.right = 0;
						margin_data.current.bottom = 0;
						if ( ed.drop.type == 'side-before' ){
							var $nx_wrap = ed.drop.insert[1];
							if ( $nx_wrap.size() > 0 ){
								var nx_wrap = ed.get_wrap($nx_wrap),
									need_adj = _.filter(ed.get_wrap_els(nx_wrap), function(each){
										return ( me.$el.get(0) != each.$el.get(0) && each.outer_grid.left == nx_wrap.grid.left );
									}),
									need_adj_min = ed.get_wrap_el_min(nx_wrap);
								if ( ! $nx_wrap.hasClass('clr') || ed.drop.is_clear ){
									ed.adjust_els_right(need_adj, nx_wrap.grid.left+drop_col+drop_left-1);
									$nx_wrap.data('clear', 'none');
								}
								if ( ed.drop.is_switch ){
									ed.adjust_els_right(need_adj, nx_wrap.grid.left+drop_left-1);
									$nx_wrap.css('left', '');
								}
							}
						}
						else if ( ed.drop.type == 'side-after' ){
							var $pv_wrap = ed.drop.insert[1];
							if ( $pv_wrap.size() > 0 && ed.drop.is_switch ){
								var pv_wrap = ed.get_wrap($pv_wrap),
									need_adj = _.filter(ed.get_wrap_els(pv_wrap), function(each){
										return ( me.$el.get(0) != each.$el.get(0) && each.outer_grid.left == pv_wrap.grid.left );
									});
								ed.adjust_els_right(need_adj, pv_wrap.grid.left-(me.grid.left-me.outer_grid.left)-1);
								$pv_wrap.css('left', '');
							}
						}
						else if ( ed.drop.type == 'inside' ) {
							var $drop_wrap = $drop.closest('.upfront-wrapper'),
								drop_wrap = ed.get_wrap($drop_wrap),
								drop_wrap_aff = drop_wrap ? ed.get_affected_wrapper_els(drop_wrap, ed.wraps, (wrap && ed.get_wrap_els(wrap).length == 1 ? [wrap, me] : [me]), true) : false;
							if ( drop_wrap ){
								ed.adjust_affected_right(drop_wrap, drop_wrap_aff.right, [me], ed.drop.left+drop_col+drop_left-1);
							}
						}
						$me.data('margin', margin_data);
					}
				}
				
				function drop_update () {
					$('.upfront-drop').remove();
					$('.upfront-drop-view').remove();
					$('#upfront-drop-preview').remove();
					$('#upfront-compare-area').remove();
					
					ed.update_class($me, ed.grid.class, drop_col);
					( is_object ? ed.containment.$el.find('.upfront-object') : $layout.find('.upfront-module') ).each(function(){
						ed.update_margin_classes($(this));
					});
					
					ed.update_wrappers(region);
					$me.css({
						'position': '',
						'top': '',
						'left': '',
						'z-index': '',
						'visibility': 'visible'
					});
					
					// Update model value
					( is_object ? ed.containment.$el.find('.upfront-object') : $layout.find('.upfront-module') ).each(function(){
						var $el = $(this),
							margin = $el.data('margin'),
							classes;
						if ( margin && 
							( margin.original.left != margin.current.left ||
							margin.original.top != margin.current.top ||
							margin.original.bottom != margin.current.bottom ||
							margin.original.right != margin.current.right )
						){
							classes = [
								ed.grid.left_margin_class+margin.current.left,
								ed.grid.right_margin_class+margin.current.right,
								ed.grid.top_margin_class+margin.current.top,
								ed.grid.bottom_margin_class+margin.current.bottom
							];
							if ( $me.get(0) == $el.get(0) )
								classes.push( ed.grid.class + drop_col );
							ed.update_model_classes($el, classes);
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
						if ( model.get('shadow') ){
							view.trigger('on_layout');
							model.unset('shadow', {silent: true});
						}
						$me.removeAttr('data-shadow');
						$('.upfront-region-drag-active').find('.upfront-module').each(function(){
							var element_id = $(this).attr('id'),
								each_model = modules.get_by_element_id(element_id);
							if ( !each_model && element_id == $me.attr('id') )
								models.push(model);
							else if ( each_model )
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
					if(move_region){
						view.region = region;
						view.trigger('region:updated');
					}
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
	
	normalize_module_remove: function (view, module, modules, wrapper, wrappers) {
		var app = Upfront.Application.LayoutEditor,
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
				next_wrapper.replace_class(
					ed.grid.class + (next_wrapper_col+wrapper_col) +
					( wrapper_class.match(/clr/g) ? ' clr' : '' )
				);
				adjust_next = true;
				split_next = true;
			}
		}
		if ( prev_module ) {
			prev_wrapper = wrappers.get_by_wrapper_id(prev_module.get_wrapper_id());
			prev_wrapper_class = prev_wrapper.get_property_value_by_name('class');
			if ( prev_wrapper_class.match(/clr/g) && !split_next )
				split_prev = true;
		}
		while ( modules.at(i) ){
			var this_module = modules.at(i),
				this_module_class = this_module.get_property_value_by_name('class'),
				this_module_left = ed.get_class_num(this_module_class, ed.grid.left_margin_class);
			if ( prev_wrapper && this_module.get_wrapper_id() == prev_wrapper.get_wrapper_id() ) {
				prev_modules.push(this_module);
				i++;
				continue;
			}
			if ( next_wrapper && this_module.get_wrapper_id() == next_wrapper.get_wrapper_id() ) {
				next_modules.push(this_module);
				i++;
				continue;
			}
			if ( i > index ) {
				var this_wrapper = wrappers.get_by_wrapper_id(this_module.get_wrapper_id()),
					this_wrapper_class = this_wrapper.get_property_value_by_name('class');
				if ( !this_wrapper_class.match(/clr/g) )
					split_next = false;
				break;
			}
			i++;
		}
		if ( adjust_next ){
			_.each(next_modules, function (each_module, id) {
				var each_module_class = each_module.get_property_value_by_name('class'),
					each_module_left = ed.get_class_num(each_module_class, ed.grid.left_margin_class);
				each_module.replace_class(ed.grid.left_margin_class + (each_module_left+wrapper_col));
			});
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
	 * Create region resizable
	 * 
	 * @param {Object} view
	 * @param {Object} model
	 */
	create_region_resizable: function(view, model){
		if ( !model.get("container") || model.get("container") == model.get("name") )
			return;
		var app = this,
			ed = Upfront.Behaviors.GridEditor,
			$me = view.$el,
			$main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			$layout = $main.find('.upfront-layout'),
			collection = model.collection,
			index = collection.indexOf(model),
			total = collection.size()-1, // total minus shadow region
			next_model = index < total-1 ? collection.at(index+1) : false,
			is_left = false,
			container = model.get('container')
		;
		if ( next_model !== false && (next_model.get('container') == container || next_model.get('name') == container) )
			is_left = true;
		$me.resizable({
			"containment": 'parent',
			//handles: "n, e, s, w",
			handles: is_left ? 'e' : 'w',
			helper: "region-resizable-helper",
			disabled: true,
			zIndex: 9999999,
			start: function(e, ui){
				var col = ed.get_class_num($me, ed.grid.class);
				ed.col_size = $('.upfront-grid-layout:first').outerWidth()/ed.grid.size;
				$(this).resizable('option', 'minWidth', ed.col_size*3);
				$(this).resizable('option', 'maxWidth', ed.col_size*10);
				Upfront.Events.trigger("entity:region:resize_start", view, view.model);
			},
			resize: function(e, ui){
				// @TODO Suppppperrrr annoying bug happen on resizable 1.10.3, fix only for this version and make sure to recheck in future update on this lib!
				// Normalize the ui.size
				var that = $(this).data('ui-resizable'),
					woset = Math.abs( that.offset.left ) + that.sizeDiff.width,
					isParent = that.containerElement.get(0) === that.element.parent().get(0),
					isOffsetRelative = /relative|absolute/.test(that.containerElement.css("position"));
					if(isParent && isOffsetRelative) {
						woset -= that.parentData.left;
					};
					if ( woset + that.size.width >= that.parentData.width )
						ui.size.width += that.parentData.left;
				// End this fix
				var $helper = ui.helper,
					col = ed.get_class_num($me, ed.grid.class),
					prev_col = $me.prev('.upfront-region').size() > 0 ? ed.get_class_num($me.prev('.upfront-region'), ed.grid.class) : 0,
					next_col = $me.next('.upfront-region').size() > 0 ? ed.get_class_num($me.next('.upfront-region'), ed.grid.class) : 0,
					max_col = col + ( next_col > prev_col ? next_col : prev_col ),
					current_col = Math.abs(Math.ceil(ui.size.width/ed.col_size)),
					w = ( current_col > max_col ? Math.round(max_col*ed.col_size) : ui.size.width ),
					h = ( (ui.size.height > 15 ? ui.size.height : 0) || ui.originalSize.height ),
					rsz_col = ( current_col > max_col ? max_col : current_col ),
					rsz_row = Math.ceil(h/ed.baseline)
				;
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
			$layout = $main.find('.upfront-layout')
		;
		$me.resizable({
			"containment": 'parent',
			//handles: "n, e, s, w",
			handles: 's',
			helper: "region-resizable-helper",
			disabled: true,
			zIndex: 9999999,
			start: function(e, ui){
				Upfront.Events.trigger("entity:region_container:resize_start", view, view.model);
			},
			resize: function(e, ui){
				// @TODO Suppppperrrr annoying bug happen on resizable 1.10.3, fix only for this version and make sure to recheck in future update on this lib!
				// Normalize the ui.size
				/*var that = $(this).data('ui-resizable'),
					woset = Math.abs( that.offset.left ) + that.sizeDiff.width,
					isParent = that.containerElement.get(0) === that.element.parent().get(0),
					isOffsetRelative = /relative|absolute/.test(that.containerElement.css("position"));
					if(isParent && isOffsetRelative) {
						woset -= that.parentData.left;
					};
					if ( woset + that.size.width >= that.parentData.width )
						ui.size.width += that.parentData.left;*/
				// End this fix
				var $helper = ui.helper,
					h = ( (ui.size.height > 15 ? ui.size.height : 0) || ui.originalSize.height ),
					rsz_row = Math.ceil(h/ed.baseline)
				;
				if ( Math.abs($(window).height()-e.clientY) < 50 ){
					h += (ed.baseline*10);
					$(window).scrollTop( $(window).scrollTop()+(ed.baseline*10) );
				}
				$helper.css({
					width: '100%',
					height: h
				});
				$me.data('resize-row', rsz_row);
			},
			stop: function(e, ui){
				var rsz_row = $me.data('resize-row');
				
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
				model.set_property('row', rsz_row);
				Upfront.Events.trigger("entity:region_container:resize_stop", view, view.model);
			}
		});
	},
	
	/**
	 * Toggle region resizable
	 * 
	 */
	toggle_region_resizable: function(enable){
		$('.upfront-region, .upfront-region-container').each(function(){		
			if ( !$(this).hasClass('ui-resizable') )
				return;
			$(this).resizable('option', 'disabled', (!enable));
		});
	},
	
	
	/**
	 * Debug stuff 
	 */
	set_timeout: function(timeout){
		this.timeout = timeout;
	},
	set_compare_size: function(col, row){
		this.compare_col = col;
		this.compare_row = row;
	},
	toggle_debug: function(){
		this.show_debug_element = !this.show_debug_element;
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