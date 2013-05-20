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
	grid_layout: {left: 0, right: 0},
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
			grid_y = Math.round((y-ed.main.top)/ed.baseline)+1;
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
		return wrap_el_min;
	},
	
	get_wrap_el_max: function( use_wrap, ignore, bottom ){
		var ed = Upfront.Behaviors.GridEditor,
			wrap_els = ed.get_wrap_els(use_wrap),
			wrap_el_max = _.max(_.reject(wrap_els, function(el){
				return ignore ? _.find(ignore, function(i){ return i.$el.get(0) == el.$el.get(0); }) : false;
			}), function(each){
				return bottom ? each.grid.bottom : each.grid.right;
			});
		return wrap_el_max;
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
			_.each(classes, function(cls){
				model.replace_class(cls);
			});
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
		
		ed.max_row = Math.floor(($(window).height()*.6)/ed.baseline);
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
		ed.col_size = $('.upfront-grid-layout:first').outerWidth()/ed.grid.size;
		ed.main = {
			$el: $main,
			top: main_pos.top,
			left: main_pos.left,
			right: main_pos.left + $main.outerWidth()
		};
		ed.grid_layout = {
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
		
		ed.normalize(ed.els, ed.wraps);
	},
	
	/**
	 * Create droppable points 
	 */
	create_drop_point: function(me, wrap){
		var app = Upfront.Application.LayoutEditor,
			ed = Upfront.Behaviors.GridEditor,
			aff_els = wrap ? ed.get_affected_wrapper_els(wrap, ed.wraps, [], true) : ed.get_affected_els(me, ed.els, [], true),
			margin = me.$el.data('margin'),
			col = me.col,
			wrap_col = wrap ? ed.get_class_num(wrap.$el, ed.grid.class) : col;
		// Add dropables in each regions
		_.each(ed.regions, function(each){
			var drop_wrap_full = '<div class="upfront-drop upfront-drop-wrap upfront-drop-wrap-full upfront-drop-y" style="height:0px;"></div>';
			each.$el.find(".upfront-editable_entities_container:first").prepend($(drop_wrap_full).addClass('upfront-drop-first'));
			if ( each.$el.find('.upfront-module').size() > 0 )
				each.$el.find(".upfront-editable_entities_container:first").append($(drop_wrap_full).addClass('upfront-drop-last'));
		});
		// Finding dropable places that's outside of wrapper
		_.each(ed.wraps, function(each, index, list){
			var is_me = ( wrap && each.$el.get(0) == wrap.$el.get(0) && wrap.$el.children(':not(.upfront-drop)').size() == 1 ),
				aff = ed.get_affected_wrapper_els(each, ed.wraps, [], true),
				lmt = ed.get_move_limit(aff, ed.containment),
				els = ed.get_wrap_els(each),
				el_min = ed.get_wrap_el_min(each),
				region = ed.get_region(each.$el.closest('.upfront-region')),
				drop_wrap_full = '<div class="upfront-drop upfront-drop-wrap upfront-drop-wrap-full upfront-drop-y" style="height:0px;"></div>';
				drop_wrap_fxd = '<div class="upfront-drop upfront-drop-wrap upfront-drop-x upfront-drop-fixed" style="height:'+each.$el.outerHeight()+'px;"></div>';
			
			// Add full dropable after each first column wrapper
			if ( each.grid.left == region.grid.left && !each.$el.prev().hasClass('upfront-drop-wrap-full') ){
				each.$el.before(drop_wrap_full);
			}
			// The wrapper right side has enough space, so add a dropable place after it
			if ( !is_me && lmt[1]-each.grid.right >= col ){
				each.$el.after($(drop_wrap_fxd).addClass(ed.grid.class+(lmt[1]-each.grid.right)));
			}
			// The wrapper placed on first column and the left side has enough space, so add a dropable place before it
			if ( !is_me && each.grid.left == region.grid.left && el_min.grid.left-each.grid.left >= col ){
				each.$el.before($(drop_wrap_fxd).addClass(ed.grid.class+(el_min.grid.left-lmt[0])+' clr'));
			}
		});
		// Add sibling swap dropable
		/*if ( aff_els.left.length == 1 ||  aff_els.right.length == 1 ){
			var drop_wrap_x = '<div class="upfront-drop upfront-drop-wrap upfront-drop-x upfront-drop-fixed upfront-drop-swap"></div>';
			if ( aff_els.left.length == 1 ){
				var $left_wrap = aff_els.left[0].$el.closest('.upfront-wrapper');
				$left_wrap.before($(drop_wrap_x).css('height', $left_wrap.outerHeight()));
			}
			if ( aff_els.right.length == 1 ){
				var $right_wrap = aff_els.right[0].$el.closest('.upfront-wrapper');
				$right_wrap.after($(drop_wrap_x).css('height', $right_wrap.outerHeight()));
			}
		}*/
		_.each(ed.els, function(each, index, els){
			var is_me = ( each.$el.get(0) == me.$el.get(0) ),
				$each_wrap = each.$el.closest('.upfront-wrapper'),
				wrap_pos = _.find(ed.wraps, function(w){ return w.$el.get(0) == $each_wrap.get(0); }),
				aff = wrap_pos ? ed.get_affected_wrapper_els(wrap_pos, ed.wraps, [me], true) : ed.get_affected_els(each, ed.els, [me], true),
				lmt = ed.get_move_limit(aff, ed.containment),
				drop = '<div class="upfront-drop upfront-drop-obj upfront-drop-y '+( is_me ? ' upfront-drop-me '+ed.grid.top_margin_class : '' )+'" style="height:0;"></div>',
				drop_wrap_y = '<div class="upfront-drop upfront-drop-wrap upfront-drop-y '+( is_me ? ' upfront-drop-me' : '' )+'" style="height:0;"></div>';
		
			// Is current element and the only element in the wrapper
			if ( is_me && wrap_pos && $each_wrap.children().size() == 1 ){
				var clr = $each_wrap.hasClass('clr') ? ' clr' : '';
				/*if ( $each_wrap.prev().hasClass('upfront-drop') )
					$each_wrap.prev().addClass('upfront-drop-me'+clr);
				else if ( lmt[0] == 1 && lmt[1] == ed.containment.grid.right )
					$each_wrap.before($(drop_wrap_y).addClass('upfront-drop-wrap-full'));*/
				// The dropable already there, so just add class
				if ( $each_wrap.hasClass('clr') && $each_wrap.next().hasClass('upfront-drop-wrap-full') )
					$each_wrap.next().addClass('upfront-drop-me');
				// Else we add the dropable
				else
					$each_wrap.before($(drop_wrap_y).addClass(ed.grid.class + (lmt[1] == ed.containment.grid.right ? lmt[1]-lmt[0]+1 : wrap_col) + clr));
				wrap.$el.hide();
			}
			// Add dropable inside wrapper, in condition that the element has affected elements on either left/right
			else if ( lmt[1]-lmt[0]+1 >= col && ( ( wrap_pos && ( aff.right.length > 0 || aff.left.length > 0 ) ) || !wrap_pos ) ){
				if ( !is_me && ( !each.$el.parent().prev() || !each.$el.parent().prev().hasClass('upfront-drop') ) )
					each.$el.parent().before(drop);
				if ( is_me && each.$el.prev() && each.$el.parent().prev().hasClass('upfront-drop') )
					each.$el.parent().prev().addClass('upfront-drop-me');
				else if ( is_me )
					each.$el.parent().after(drop);
				else
					each.$el.parent().after($(drop).addClass('upfront-drop-after'));
			}
			/*else if ( ( !is_me && ed.containment.grid.right-lmt[0]+1 >= col && ed.containment.grid.right-lmt[0]+1 < col+lmt[1]-lmt[0]+1 ) && ( !$each_wrap.prev() || !$each_wrap.prev().hasClass('upfront-drop') ) ) {
				$each_wrap.before($(drop_wrap_y).addClass(ed.grid.size+(ed.containment.grid.right-lmt[0]+1)));
			}*/
			/*else if ( !is_me && lmt[1] == ed.containment.grid.right  ){
				$each_wrap.after($(drop_wrap_y).addClass('upfront-drop-after '+ed.grid.class+col));
			}*/
			/*if ( lmt[1] == ed.containment.grid.right ){
				ed.update_class($each_wrap, ed.grid.class, lmt[1]-lmt[0]+1);
			}*/
		});
		//$('.upfront-drop-me').addClass(ed.grid.top_margin_class+margin.original.top);
		$('.upfront-drop-me').css({height:me.height+(margin.original.top*ed.baseline)});
		$('.upfront-drop-fixed').each(function(){
			var pos = $(this).position();
			$(this).css({
				position: 'absolute',
				top: pos.top,
				left: pos.left
			});
		});
		ed.drops = _.map($('.upfront-drop'), function(each){
			var $el = $(each),
				off = $el.offset(),
				left = off.left,
				right = left + $el.outerWidth(),
				top = off.top,
				bottom = top + $el.outerHeight(),
				y = top + ( (bottom-top)/2 ),
				x = left + ( (right-left)/2 ),
				grid = ed.get_grid(x, y),
				grid1 = ed.get_grid(left, top),
				grid2 = ed.get_grid(right, bottom),
				is_after = $el.hasClass('upfront-drop-after'),
				is_me = $el.hasClass('upfront-drop-me'),
				is_full = $el.hasClass('upfront-drop-wrap-full'),
				is_first = $el.hasClass('upfront-drop-first'),
				is_last = $el.hasClass('upfront-drop-last'),
				y_rel = ( is_after ? -2 : ( is_full ? ( is_first ? -2 : 0 ) : 2 ) );
			return {
				$el: $el,
				x: grid.x,
				y: grid.y+y_rel,
				left: grid1.x,
				right: grid2.x-1,
				top: grid1.y+y_rel,
				bottom: grid2.y+y_rel
			};
		});
		$('.upfront-drop-x').css({width:0});
		$('.upfront-drop').append('<div class="upfront-drop-preview">');
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
		$me.resizable({
			"containment": "parent",
			autoHide: true,
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
				model.replace_class(ed.grid.class+rsz_col);
				Upfront.Events.trigger("entity:resize_stop", view, view.model);
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
			$layout = $main.find('.upfront-layout')
		;
		if ( model.get_property_value_by_name('disable_drag') === 1 ){
			return false;
		}
		//$me.append('<div class="upfront-drag-handle" />');
		$me.draggable({
			revert: true,
			revertDuration: 0,
			zIndex: 100,
			helper: 'clone',
			//handle: '.upfront-drag-handle',
			appendTo: $main,
			start: function(e, ui){
				$main.addClass('upfront-dragging');
				
				ed.start(view, model);
				var $helper = $('.ui-draggable-dragging'),
					$wrap = $me.closest('.upfront-wrapper'),
					me = ed.get_el($me),
					wrap = ed.get_wrap($wrap);
				$me.hide();
				$helper.css('max-width', me.width);
				$helper.css('height', me.height);
				$helper.css('max-height', ed.max_row*ed.baseline);
				ed.create_drop_point(me, wrap);
				
				_.each(ed.els, function(each){
					each.$el.find(".upfront-debug-info").size() || each.$el.find('.upfront-editable_entity:first').append('<div class="upfront-debug-info"></div>');
					each.$el.find(".upfront-debug-info").text('grid: ('+each.grid.left+','+each.grid.top+'),('+each.grid.right+','+each.grid.bottom+') | outer: ('+each.outer_grid.left+','+each.outer_grid.top+'),('+each.outer_grid.right+','+each.outer_grid.bottom+') | center: '+each.grid_center.x+','+each.grid_center.y);
				});
				_.each(ed.drops, function(each){
					each.$el.append('<div class="upfront-drop-debug">('+each.left+','+each.top+'),('+each.right+','+each.bottom+'),('+each.x+','+each.y+')</div>');
				});
				$helper.find(".upfront-debug-info").size() || $helper.append('<div class="upfront-debug-info"></div>');
				
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
				var regions_area = _.map(ed.regions, function(each){
						var top, bottom, left, right, area;
						if ( compare_area_left >= each.grid.left && compare_area_left <= each.grid.right )
							left = compare_area_left;
						else if ( compare_area_left < each.grid.left )
							left = each.grid.left;
						if ( compare_area_right >= each.grid.left && compare_area_right <= each.grid.right )
							right = compare_area_right;
						else if ( compare_area_right > each.grid.right )
							right = each.grid.right;
						if ( compare_area_top >= each.grid.top && compare_area_top <= each.grid.bottom )
							top = compare_area_top;
						else if ( compare_area_top < each.grid.top )
							top = each.grid.top;
						if ( compare_area_bottom >= each.grid.top && compare_area_bottom <= each.grid.bottom )
							bottom = compare_area_bottom;
						else if ( compare_area_bottom > each.grid.bottom )
							bottom = each.grid.bottom;
						if ( top && bottom && left && right && grid.x > 0 && grid.x <= ed.grid.size )
							area = (right-left+1) * (bottom-top+1);
						else
							area = 0;
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
					
				// Get closest dropable
				var hovered_drops = _.filter(ed.drops, function(each){
					if ( !each.$el.closest('.upfront-region').hasClass('upfront-region-drag-active') )
						return false;
					if ( // This works for vertical drops
						(( compare_area_left >= each.left && compare_area_left <= each.right ) ||
						( compare_area_right >= each.left && compare_area_right <= each.right ))/* && 
						(( each.top >= compare_area_top && each.top <= compare_area_bottom ) || 
						( each.bottom >= compare_area_top && each.bottom <= compare_area_bottom ))*/
					)
						return true;
					if ( // This works for horizontal drops
						(( each.left >= compare_area_left && each.left <= compare_area_right ) || 
						( each.right >= compare_area_left && each.right <= compare_area_right )) && 
						(( compare_area_top >= each.top && compare_area_top <= each.bottom ) || 
						( compare_area_bottom >= each.top && compare_area_bottom <= each.bottom ))
					)
						return true;
				}),
				drop = _.map(hovered_drops, function(each){
					var diff_x = /*each.left - current_grid_left*/ 0,
						diff_y = each.y - compare_area_top;
						d = Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y, 2)),
						diff_x1 = /*each.left - current_grid_left*/ 0,
						diff_y1 = each.top - compare_area_top,
						d1 = Math.sqrt(Math.pow(diff_x1, 2) + Math.pow(diff_y1, 2)),
						diff_x2 = /*each.left - current_grid_left*/ 0,
						diff_y2 = each.bottom - compare_area_top,
						d2 = Math.sqrt(Math.pow(diff_x2, 2) + Math.pow(diff_y2, 2)),
						//d_min = (d+d1+d2)/3;
						d_min = _.min([d, d1, d2]);
					return {
						$el: each.$el,
						left: each.left,
						right: each.right,
						top: each.top,
						bottom: each.bottom,
						d: d_min
					};
				}),
				get_clst_drop = _.min(drop, function(each){ return each.d; }),
				clst_drops = _.filter(drop, function(each){ return each.d == get_clst_drop.d; }),
				clst_drops_sort = _.sortBy(clst_drops, function(each, index, list){
					// Sort by priority
					/*if ( each.$el.hasClass('upfront-drop-me') )
						return 1;
					else if ( each.$el.hasClass('upfront-drop-use') )
						return 2;
					else*/ if ( each.$el.hasClass('upfront-drop-after') )
						return 4;
					else if ( each.$el.hasClass('upfront-drop-wrap-full') )
						return 5;
					else if ( each.$el.hasClass('upfront-drop-fixed') )
						return 2;
					else
						return 3;
				}),
				clst_drop = _.first(clst_drops_sort),
				$clst_drop_el = clst_drop ? clst_drop.$el : $('.upfront-drop-me'),
				$preview = $clst_drop_el.find('.upfront-drop-preview');
				
				if ( !$clst_drop_el.hasClass('upfront-drop-use') ){
					$('.upfront-drop-use').removeClass('upfront-drop-use');
					$('.upfront-drop-x').not($clst_drop_el).stop().animate({width:0}, 500);
					$('.upfront-drop-y').not($clst_drop_el).not('.upfront-drop-me.upfront-drop-wrap:not(.upfront-drop-wrap-full)').stop().animate({height:0}, 500);
					if ( $clst_drop_el.hasClass('upfront-drop-x') ){
						var ani_w = $clst_drop_el.hasClass('clr') ? width : (clst_drop.right-clst_drop.left+1)*ed.col_size;
						$clst_drop_el.addClass('upfront-drop-use').stop().animate({width:ani_w}, 500);
					}
					else{
						var ani_h = (margin_data.original.top*ed.baseline) + height;
						$clst_drop_el.addClass('upfront-drop-use').stop().animate({height:ani_h}, 500);
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
				
				if ( $clst_drop_el.hasClass('upfront-drop-me') ){
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
					
					$preview.css({
						marginLeft: margin_data.current.left * ed.col_size,
						marginTop: margin_data.current.top * ed.baseline
					});
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
					if ( $clst_drop_el.hasClass('upfront-drop-wrap') && $clst_drop_el.hasClass('upfront-drop-fixed') ){
						var adjusted = false;
						if ( $clst_drop_el.nextAll('.upfront-wrapper').size() > 0 ){
							var $nx_wrap = $clst_drop_el.nextAll('.upfront-wrapper').eq(0),
								nx_wrap = _.find(ed.wraps, function(each){ return $nx_wrap.get(0) == each.$el.get(0); }),
								need_adj = _.filter(ed.get_wrap_els(nx_wrap), function(each){
									return ( me.$el.get(0) != each.$el.get(0) && each.outer_grid.left == nx_wrap.grid.left )
								}),
								need_adj_min = ed.get_wrap_el_min(nx_wrap),
								drop_margin = current_grid_left-nx_wrap.grid.left,
								drop_margin_top = current_grid_top-nx_wrap.grid.top,
								adjusted = false;
							if ( ! $nx_wrap.hasClass('clr') || $clst_drop_el.hasClass('clr') ){
								var drop_margin_max = need_adj_min.grid.left-nx_wrap.grid.left-col;
								margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
								margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
								ed.adjust_els_right(need_adj, nx_wrap.grid.left+col+margin_data.current.left-1);
								$nx_wrap.data('clear', 'none');
								adjusted = true;
							}
						}
						if ( ! adjusted ){
							var drop_margin = clst_drop ? current_grid_left-clst_drop.left : current_grid_left,
								drop_margin_max = clst_drop ? clst_drop.right-clst_drop.left-col+1 : 0,
								drop_margin_top = clst_drop ? current_grid_top-clst_drop.top : current_grid_top;
							margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
							margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
						}
					}
					else if ( !$clst_drop_el.hasClass('upfront-drop-wrap') ) {
						var drop_wrap = _.find(ed.wraps, function(each){
								return ( each.$el.get(0) == $clst_drop_el.closest('.upfront-wrapper').get(0) );
							}),
							drop_wrap_aff = drop_wrap ? ed.get_affected_wrapper_els(drop_wrap, ed.wraps, (wrap && ed.get_wrap_els(wrap).length == 1 ? [wrap, me] : [me]), true) : false,
							drop_lmt = drop_wrap ? ed.get_move_limit(drop_wrap_aff, ed.containment) : false,
							drop_margin = drop_wrap ? current_grid_left-drop_lmt[0] : 0,
							drop_margin_max = drop_wrap ? drop_lmt[1]-drop_lmt[0]-col+1 : 0,
							drop_margin_top = clst_drop ? current_grid_top-clst_drop.top : current_grid_top;
						margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
						margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
						if ( drop_wrap )
							ed.adjust_affected_right(drop_wrap, drop_wrap_aff.right, [me], drop_lmt[0]+col+margin_data.current.left-1);
					}
					else if ( $clst_drop_el.hasClass('upfront-drop-wrap-full') ){
						var drop_margin = clst_drop ? current_grid_left-clst_drop.left : current_grid_left,
							drop_margin_max = clst_drop ? clst_drop.right-clst_drop.left-col+1 : 0,
							drop_margin_top = current_grid_top-clst_drop.top;
						margin_data.current.left = drop_margin && drop_margin > 0 ? ( drop_margin > drop_margin_max ? drop_margin_max : drop_margin ) : 0;
						margin_data.current.top = drop_margin_top > 0 ? drop_margin_top : 0;
					}
					$me.data('margin', margin_data);
				
					$preview.css({
						marginLeft: margin_data.current.left * ed.col_size,
						marginTop: margin_data.current.top * ed.baseline
					});
				}
				
				$helper.find(".upfront-debug-info").text('grid: '+grid.x+','+grid.y+' | current: ('+current_grid_left+','+current_grid_top+'),('+current_grid_right+','+current_grid_bottom+') | margin size: '+margin_data.current.top+'/'+margin_data.current.left+','+margin_data.current.right);
				
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
				}
				$('.upfront-drop').remove();
				
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
					model.set_property('wrapper_id', wrapper_id);
				
				if ( !move_region ){
					view.resort_bound_collection();
				}
				else {
					var modules = region.get('modules'),
						models = [];
					model.unset('shadow');
					model.collection.remove(model);
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
				//if ( dropped ){
					$me = view.$el.find('.upfront-editable_entity:first');
					$me.one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(){ $(this).removeClass('upfront-dropped'); }).addClass('upfront-dropped');
					//setTimeout(function(){ $me.removeClass('upfront-dropped'); }, 500);
				//}
				
				$('.upfront-region-drag-active .upfront-module').css('max-height', '');
				$('.upfront-region-drag-active').removeClass('upfront-region-drag-active');
				$main.removeClass('upfront-dragging');
				
				Upfront.Events.trigger("entity:drag_stop", view, view.model);
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