(function ($) {

define(function(){
	
var DragDrop = function (view, model) {
	this.initialize(view, model);
}

DragDrop.prototype = {
	module_selector: '> .upfront-module-view > .upfront-module, > .upfront-module-group',
	
	view: false,
	model: false,
	$me: false,
	$wrap: false,
	$region: false,
	$main: false,
	$layout: false,
	me: false,
	wrap: false,
	region: false,
	current_region: false,
	$container: false,
	$current_container: false,
	
	region_model: false,
	current_region_model: false,
	current_wrappers: false,
	
	is_group: false,
	is_parent_group: false,
	is_disabled: false,
	
	$helper: false,
	event: false,
	ui: false,
	breakpoint: false,
	app: false,
	ed: false,

	drop_areas: false,
	drop_areas_created: false,
	drops: false,
	drop: false,
	drop_col: 0,
	drop_left: 0,
	drop_top: 0,
	area_col: 0,
	current_area_col: 0,
	current_row_wraps: false,
	wrapper_id: false,
	wrap_only: false,
	new_wrap_view: false,
	move_region: false,

	current_grid: false,
	current_grid_pos: false,
	compare_area: false,
	compare_area_position: false,
	compare_col: 0,
	compare_row: 0,
	_last_drag_position: false,
	_last_drag_time: 0,
	_last_coord: false,
	_t: false,
	_focus_t: false,
	
	focus: false,
	focus_coord: false,
	
	initialize: function (view, model) {
		this.view = view;
		this.model = model;
		this.app = Upfront.Application;
		this.ed = Upfront.Behaviors.GridEditor;

		// Default property setup
		this.drop_areas = [];
		this.drop_areas_created = [];
		this.drops = [];
		this.current_row_wraps = [];
		this.current_grid = {};
		this.current_grid_pos = {};
		this.compare_area = {};
		this.compare_area_position =  {};
		this._last_coord = {x: 0, y: 0};
		this.focus_coord = {x: 0, y: 0};

		this.setup();
	},
	
	setup: function () {
		this.is_group = this.view.$el.hasClass('upfront-module-group');
		this.is_parent_group = ( typeof this.view.group_view != 'undefined' );
		this.is_disabled = ( this.is_parent_group && !this.view.group_view.$el.hasClass('upfront-module-group-on-edit') );
		this.$me = this.is_group ? this.view.$el : this.view.$el.find('.upfront-editable_entity:first');
		this.$main = $(Upfront.Settings.LayoutEditor.Selectors.main);
		this.$layout = this.$main.find('.upfront-layout');

		if ( this.app.mode.current !== this.app.MODE.THEME && this.model.get_property_value_by_name('disable_drag') ) {
			return false;
		}
		// No draggable for spacer
		if ( this.$me.hasClass('upfront-module-spacer') ) {
			return false;
		}
		if ( this.$me.data('ui-draggable') ){
			if ( this.is_group || !this.is_disabled ) {
				this.$me.draggable('option', 'disabled', false);
			}
			return false;
		}
		
		this.$me.draggable({
			revert: true,
			revertDuration: 0,
			zIndex: 100,
			helper: 'clone',
			disabled: this.is_disabled,
			cancel: '.upfront-entity_meta, .upfront-element-controls',
			distance: 10,
			appendTo: this.$main,
			iframeFix: true,
			start: $.proxy(this.on_start, this),
			drag: $.proxy(this.on_drag, this),
			stop: $.proxy(this.on_stop, this)
		});
	},
	
	on_start: function (e, ui) {
		this.ed.time_start('drag start');
		this.event = e;
		this.ui = ui;
		this.breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON();
		this.is_parent_group = ( typeof this.view.group_view != 'undefined' );
		
		this.prepare_drag();

		this.ed.time_end('drag start');
		this.ed.time_start('drag start - trigger');
		Upfront.Events.trigger("entity:drag_start", this.view, this.model);
		this.ed.time_end('drag start');
	},
	
	on_drag: function (e, ui) {
		var that = this;
		this.event = e;
		this.ui = ui;
		
		//this.ed.time_start('dragging');

		// change drop point on timeout
		clearTimeout(this._t);
		this._t = setTimeout(function(){ that.update_drop_timeout(); }, this.ed.timeout);

		this.update_drop_position();

		if ( this.ed.show_debug_element ){
			this.$helper.find(".upfront-debug-info").text(
				'grid: '+this.current_grid.x+','+this.current_grid.y+' | ' +
				'current: ('+this.current_grid_pos.left+','+this.current_grid_pos.top+'),('+this.current_grid_pos.right+','+this.current_grid_pos.bottom+') | ' + 
				'margin size: '+this.drop_top+'/'+this.drop_left
			);
		}
		//this.ed.time_end('dragging');
	},
	
	on_stop: function (e, ui) {
		var that = this;
		this.ed.time_start('drag stop');
		this.event = e;
		this.ui = ui;
		
		clearTimeout(this._t);
		clearTimeout(this._focus_t);
		
		if ( !this.drop.is_me ) {
			this.render_drop();
		}
		this.clean_elements();
		this.update_models();
		this.update_views();
		this.reset();
		
		// Add drop animation
		var $me = this.is_group ? this.view.$el : this.view.$el.find('.upfront-editable_entity:first');
		var ani_event_end = 'animationend.drop_ani webkitAnimationEnd.drop_ani MSAnimationEnd.drop_ani oAnimationEnd.drop_ani';
		$me.one(ani_event_end, function(){
			$(this).removeClass('upfront-dropped');
			Upfront.Events.trigger("entity:drag_animate_stop", that.view, that.model);
			$me.off(ani_event_end); // Make sure to remove any remaining unfired event
		}).addClass('upfront-dropped');
		
		
		Upfront.Events.trigger("entity:drag_stop", this.view, this.model);
		this.view.trigger("entity:drop", {
			col: this.drop_col, 
			left: this.drop_left, 
			top: this.drop_top
		}, this.view, this.model);
		this.view.trigger("entity:self:drag_stop");
		
		this.ed.time_end('drag stop');
	},
	
	update_vars: function () {
		var regions = this.app.layout.get("regions");
		this.$helper = $('.ui-draggable-dragging');
		this.$wrap = this.$me.closest('.upfront-wrapper');
		this.$region = this.$me.closest('.upfront-region');
		this.me = this.ed.get_el(this.$me);
		this.wrap = this.ed.get_wrap(this.$wrap);
		this.region = this.ed.get_region(this.$region);
		this.region_model = regions.get_by_name(this.region.region);
		this.$container = this.$region.find('.upfront-modules_container > .upfront-editable_entities_container:first');
	},
	
	/**
	 * Create droppable points
	 */
	create_drop_point: function () {
		var ed = this.ed;
		ed.time_start('fn create_drop_point');
		
		var breakpoint = this.breakpoint,
			that = this,
			me = this.me,
			me_wrap = this.wrap,
			margin = me.$el.data('margin'),
			col = me.col,
			min_col = me.$el.hasClass('upfront-image_module') ? 1 : (col > ed.min_col ? ed.min_col : col),
			row = me.row > ed.max_row ? ed.max_row : me.row,
			is_spacer = me.$el.hasClass('upfront-module-spacer'),
			regions = this.app.layout.get("regions")
		;

		var $sibling_els = Upfront.Util.find_sorted(me.$el.closest('.upfront-wrapper')),
			has_siblings = $sibling_els.length > 1,
			sibling_index = $sibling_els.index(me.$el);

		_.each(this.drop_areas, function(area, area_index){
			if ( _.contains(me.drop_areas_created, area) ) return; // Don't run this over created area
			var is_region = area.$el.hasClass('upfront-region'),
				is_in_region = is_region ? ( area.$el.get(0) == that.current_region.$el.get(0) ) : false
			;
			if ( is_region && !is_in_region ) return; // Just create drop point for current region
			var $area = area.$el.find(".upfront-editable_entities_container:first"),
				$region = is_region ? area.$el : area.$el.closest('.upfront-region'),
				region_name = $region.data('name'),
				region = is_region ? area : ed.get_region($region),
				region_model = regions.get_by_name(region_name),
				area_model = is_region ? region_model : region_model.get('modules').get_by_element_id(area.$el.attr('id')),
				lines = ed.parse_modules_to_lines(area_model.get('modules'), area_model.get('wrappers'), breakpoint.id, area.col),
				/*$wraps = Upfront.Util.find_sorted($area, '> .upfront-wrapper:visible').filter(function(){
					return ( $(this).height() > 0 )
				}),*/
				expand_lock = $region.hasClass('upfront-region-expand-lock'),
				current_full_top = area.grid.top,
				can_drop = function (top, bottom) {
					return ( !expand_lock || ( expand_lock && bottom-top+1 >= me.row ) );
				},
				map_wrappers = function (rw) {
					var rw_view = Upfront.data.wrapper_views[rw.model.cid];
					if ( !rw_view ) return false;
					return ed.get_wrap(rw_view.$el);
				}
			;

			_.each(lines, function (line, li) {
				_.each(line.wrappers, function (w, wi) {
					var wrap_view = Upfront.data.wrapper_views[w.model.cid];
					if ( !wrap_view ) return;
					var $wrap = wrap_view.$el,
						wrap = ed.get_wrap($wrap),
						is_wrap_spacer = w.spacer,
						wrap_clr = ( wi == 0 ),
						is_wrap_me = ( me_wrap && wrap._id == me_wrap._id ),
						wrap_only = ( w.modules.length == 1 ),
						wrap_me_only = ( is_wrap_me && wrap_only ),
						prev_w = wi > 0 ? line.wrappers[wi-1] : ( li > 0 ? _.last(lines[li-1].wrappers) : false ),
						prev_wrap_view = prev_w ? Upfront.data.wrapper_views[prev_w.model.cid] : false,
						$prev_wrap = prev_wrap_view ? prev_wrap_view.$el : false,
						prev_wrap = $prev_wrap ? ed.get_wrap($prev_wrap) : false,
						prev_wrap_clr = ( wi == 1 || ( wi == 0 && li > 0 && lines[li-1].wrappers.length == 1 ) ),
						is_prev_me = ( prev_wrap && me_wrap && prev_wrap._id == me_wrap._id ),
						is_prev_wrap_spacer = prev_w ? prev_w.spacer : false,
						prev_me_only = ( is_prev_me && prev_w.modules.length == 1 ),
						next_w = wi+1 < line.wrappers.length ? line.wrappers[wi+1] : ( li+1 < lines.length ? lines[li+1].wrappers[0] : false ),
						next_wrap_view = next_w ? Upfront.data.wrapper_views[next_w.model.cid] : false,
						$next_wrap = next_wrap_view ? next_wrap_view.$el : false,
						next_wrap = $next_wrap ? ed.get_wrap($next_wrap) : false,
						next_wrap_clr = ( wi+1 == line.wrappers.length ),
						is_next_me = ( next_wrap && me_wrap && next_wrap._id == me_wrap._id ),
						is_next_wrap_spacer = next_w ? next_w.spacer : false,
						next_me_only = ( is_next_me && next_w.modules.length == 1 ),
						next_clr_w = li+1 < lines.length ? lines[li+1].wrappers[0] : false,
						next_clr_wrap_view = next_clr_w ? Upfront.data.wrapper_views[next_clr_w.model.cid] : false,
						$next_clr = next_clr_wrap_view ? next_clr_wrap_view.$el : false,
						next_clr = $next_clr ? ed.get_wrap($next_clr) : false,
						wrap_el_left = ed.get_wrap_el_min(wrap),
						wrap_el_top = ed.get_wrap_el_min(wrap, false, true),
						prev_wrap_el_left = prev_wrap ? ed.get_wrap_el_min(prev_wrap) : false,
						next_wrap_el_top = next_wrap ? ed.get_wrap_el_min(next_wrap, false, true) : false,
						next_wrap_el_left = next_wrap ? ed.get_wrap_el_min(next_wrap) : false,
						next_clr_el_top = next_clr ? ed.get_wrap_el_min(next_clr, false, true) : false,
						row_wraps = _.map(line.wrappers, map_wrappers),
						max_row_wrap = _.max(row_wraps, function(row_wrap){ return ( me_wrap && me_wrap._id == row_wrap._id ) ? -1 : row_wrap.grid.bottom; }),
						min_row_wrap = _.min(row_wraps, function(row_wrap){ return ed.get_wrap_el_min(row_wrap, false, true).grid.top; }),
						min_row_el = ed.get_wrap_el_min(min_row_wrap, false, true),
						wrap_me_in_row = _.find(row_wraps, function(row_wrap){ return me_wrap && me_wrap._id == row_wrap._id })
					;

					if ( wrap_me_in_row && that.current_row_wraps === false ) {
						that.current_row_wraps = row_wraps;
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
									( next_wrap && !next_wrap_clr && !wrap_me_only && ( $next_wrap.find(that.module_selector).size() > 1 || !is_next_me ) ) ||
									( prev_wrap && !wrap_clr && !wrap_me_only && ( $prev_wrap.find(that.module_selector).size() > 1 || !is_prev_me ) ) ||
									( next_wrap && prev_wrap && !next_wrap_clr && !wrap_clr ) ||
									( !prev_wrap && !next_wrap && is_wrap_me && $wrap.find(that.module_selector).size() > 1 )
								)
							)
							||
							( breakpoint && !breakpoint.default && is_wrap_me && $wrap.find(that.module_selector).size() > 1 )
						)
					){
						var current_el_top = wrap.grid.top,
							wrap_right = ( next_wrap && !next_wrap_clr && next_wrap_el_left ) ? next_wrap_el_left.grid.left-1 : area.grid.right;
						$els = Upfront.Util.find_sorted($wrap, that.module_selector);
						$els.each(function(i){
							if ( $(this).get(0) == me.$el.get(0) ) return;
							var $el = $(this),
								el = ed.get_el($el),
								top = ( el.outer_grid.top == wrap.grid.top ) ? wrap.grid.top : current_el_top,
								bottom = Math.ceil(el.grid_center.y),
								$prev = $els[i-1] ? $els.eq(i-1) : false,
								prev = $prev ? ed.get_el($prev) : false,
								prev_me = ( prev && prev._id == me._id );
							that.drops.push({
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
						that.drops.push({
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
							that.drops.push({
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
						( // Check if it's spacer, if it is, only allow drop if between 2 non-spacer elements
							!is_spacer
							||
							(
								( is_spacer && wrap_me_in_row )
								&&
								(
									wrap_me_only
									||
									( !is_wrap_spacer && ( !next_wrap || next_wrap_clr || !is_next_wrap_spacer ) )
								)
							)
						)
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
							that.drops.push({
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
						( // Check if it's spacer, if it is, only allow drop if between 2 non-spacer elements
							!is_spacer
							||
							(
								( is_spacer && wrap_me_in_row )
								&&
								(
									wrap_me_only
									||
									( !is_wrap_spacer && ( wrap_clr || !is_prev_wrap_spacer ) )
								)
							)
						)
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
							that.drops.push({
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
			});

			// Don't add another droppable if this is not the first el from wrapper, only on responsive
			if ( breakpoint && !breakpoint.default && has_siblings && sibling_index > 0 ){
				return;
			}

			// If spacer, don't add further
			if ( is_spacer ) {
				return;
			}

			if ( lines.length > 0 ) {
				var last_line = lines[lines.length-1],
					last_w = _.last(last_line.wrappers),
					last_wrap_view = Upfront.data.wrapper_views[last_w.model.cid],
					last_wrap = ed.get_wrap(last_wrap_view.$el),
					last_wrap_clr = ( last_wrap && last_line.wrappers.length == 1 ),
					is_drop_me = ( me_wrap && last_wrap_clr && last_wrap._id == me_wrap._id && !has_siblings ),
					bottom = ( expand_lock ? area.grid.bottom : ( area.grid.bottom-current_full_top > row ? area.grid.bottom + 5 : current_full_top + row ) ),
					last_wrappers = _.map(last_line.wrappers, map_wrappers),
					bottom_wrap = _.max(last_wrappers, function(each){
						if ( me_wrap && me_wrap._id == each._id )
							return 0;
						return each.grid.bottom;
					}),
					top = bottom_wrap.grid.bottom+1,
					bottom_not_me = ( !me_wrap || ( bottom_wrap && me_wrap && bottom_wrap._id != me_wrap._id ) ),
					priority_top = ( bottom_not_me && top > current_full_top ? top : current_full_top );
				if ( can_drop(priority_top, bottom) || is_drop_me ){
					that.drops.push({
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
					that.drops.push({
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
		ed.time_end('fn create_drop_point');
	},
	
	select_drop_point: function (drop) {
		var ed = this.ed;
		if ( !drop || drop.is_use ){
			return;
		}
		ed.time_start('fn select_drop');
		var drop_move = typeof this.drop == 'object' && !drop.is_me ? true : false;
		_.each(this.drops, function(each){
			each.is_use = ( each._id == drop._id );
		});
		this.drop = drop;

		if ( ed.show_debug_element ){
			$('.upfront-drop-view-current').removeClass('upfront-drop-view-current');
			$('#drop-view-'+drop._id).addClass('upfront-drop-view-current');
		}
		$('.upfront-drop').remove();
		
		var that = this,
			me = this.me,
			$drop = $('<div class="upfront-drop upfront-drop-use"></div>'),
			drop_change = function () {
				Upfront.Events.trigger("entity:drag:drop_change", that.view, that.model);
			},
			$insert_rel = ( drop.type == 'inside' && !drop.insert[1].hasClass('upfront-module-group') ) ?  drop.insert[1].parent() : drop.insert[1],
			insert_order = drop.insert[1].data('breakpoint_order') || 0,
			ani_width = me.width,
			ani_height = me.height
		;
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
				if ( drop.is_me ) {
					$drop.css('margin-top', me.height*-1);
					$drop.css('height', me.height);
				}
				else {
					$drop.css('height', (drop.bottom-drop.top+1)*ed.baseline);
				}
			}
		}
		else if ( drop.type == 'side-before' || drop.type == 'side-after' ) {
			var pos = $insert_rel.position();
			$drop.css('height', (drop.bottom-drop.top+1)*ed.baseline);
			// If drop is current element, add width too
			if ( drop.is_me ){
				$drop.css('width', me.width);
				if ( drop.type == 'side-before' ) $drop.css('margin-right', me.width*-1);
				else $drop.css('margin-left', me.width*-1);
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
	},
	
	prepare_drag: function () {
		var ed = this.ed,
			breakpoint = this.breakpoint
		;
		this.$main.addClass('upfront-dragging');
		// remove position which might be set to the module view
		this.view.$el.css("position", "");
		
		ed.start(this.view, this.model);
		ed.normalize(ed.els, ed.wraps);
		ed.update_position_data(ed.containment.$el);
		this.update_vars();
		this.set_current_region(this.region);
		
		var $me = this.$me,
			me = this.me,
			$helper = this.$helper,
			me_offset = $me.offset(),
			max_height = ed.max_row*ed.baseline,
			draggable = $me.data('ui-draggable'),
			cursor_top = this.event.pageY - me_offset.top,
			area = ( this.is_parent_group ? ed.get_position(this.view.group_view.$el) : ed.get_region(this.$region) ),
			drop_areas = false
		;

		// hack the cursor position
		if ( cursor_top > max_height/2 ) {
			draggable._adjustOffsetFromHelper({
				top: Math.round(( me.height > max_height ? max_height : me.height )/2)
			});
		}

		//this.$region.css('min-height', $region.css('height'));
		//$me.hide();
		$me.css('visibility', 'hidden');
		$helper.css('max-width', me.width);
		$helper.css('height', me.height);
		$helper.css('max-height', max_height);
		$helper.css('margin-left', $me.css('margin-left')); // fix error with the percentage margin applied

		this.area_col = area.col;
		if ( this.is_parent_group ) {
			area.region = this.$region.data('name');
			area.group = this.view.group_view.$el.attr('id');
			this.drop_areas = [ area ];
			this.current_area_col = area.col;
		}
		else if ( breakpoint && !breakpoint.default ) {
			this.drop_areas = [ area ];
		}
		else {
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
				if(region.$el.hasClass('upfront-region-shadow')){
					shadowregion = region;
				}

			});
			if ( lightbox ) {
				this.drop_areas = [ lightbox, shadowregion ];
			}
			else {
				this.drop_areas = ed.regions;
			}
		}


		this.current_row_wraps = false;

		this.create_drop_point();

		this.$wrap.css('min-height', '1px');

		$('.upfront-drop-me').css('height', (me.outer_grid.bottom-me.outer_grid.top)*ed.baseline);

		this.show_debug_data();

		// Default drop to me
		this.select_drop_point( _.find(this.drops, function(each){ return each.is_me; }) );
		this.$region.addClass('upfront-region-drag-active');
	},
	
	update_drop_timeout: function () {
		var breakpoint = this.breakpoint;
		this.update_compare_area();
		this.update_focus_state();
		
		if ( !breakpoint || breakpoint.default ) {
			this.update_current_region();
		}
		else {
			this.set_current_region();
		}
		this.update_current_drop_point();
	},
	
	update_compare_area: function () {
		var ed = this.ed,
			$helper = this.$helper,
			
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

			grid = ed.get_grid(this.event.pageX, this.event.pageY),
			col = this.me.col,
			
			compare_col = this.focus ? ed.focus_compare_col : ed.compare_col,
			compare_row = this.focus ? ed.focus_compare_row : ed.compare_row,

			compare_area_top = grid.y-(compare_row/2),
			compare_area_top = compare_area_top < current_grid_top ? current_grid_top : compare_area_top,
			compare_area_left = grid.x-(compare_col/2),
			compare_area_left = compare_area_left < current_grid_left ? current_grid_left : compare_area_left,
			compare_area_right = compare_area_left+compare_col-1,
			compare_area_right = compare_area_right > current_grid_right ? current_grid_right : compare_area_right,
			compare_area_bottom = compare_area_top+compare_row-1,
			compare_area_bottom = compare_area_bottom > current_grid_bottom ? current_grid_bottom : compare_area_bottom,
			compare_area_bottom = compare_area_bottom > compare_area_top+ed.max_row ? compare_area_top+ed.max_row : compare_area_bottom,

			compare_area_position = [grid.x, grid.y, compare_area_top, compare_area_right, compare_area_bottom, compare_area_left] // to store as reference
		;
		this.current_grid = grid;
		this.current_grid_pos = {
			top: current_grid_top,
			left: current_grid_left,
			right: current_grid_right,
			bottom: current_grid_bottom
		};
		this.compare_area = {
			top: compare_area_top,
			left: compare_area_left,
			right: compare_area_right,
			bottom: compare_area_bottom
		}
		this.compare_area_position = compare_area_position;
	},
	
	update_focus_state: function () {
		var that = this,
			ed = this.ed,
			moved_distance =  this._last_coord
				? Math.sqrt(Math.pow(this.event.pageX-this._last_coord.x, 2) + Math.pow(this.event.pageY-this._last_coord.y, 2))
				: 0,
			time = Date.now()
			;
		if ( this._last_drag_position && moved_distance <= ed.update_distance ){
			// Not moving much? Let's try to focus
			if ( !this._focus_t ) {
				this._focus_t = setTimeout(function(){
					that.focus = true;
					that.focus_coord.x = that.event.pageX;
					that.focus_coord.y = that.event.pageY;
					that._last_drag_time = Date.now();
					that.update_drop_timeout();
				}, ed.focus_timeout);
			}
			/*if ( time - this._last_drag_time >= ed.focus_timeout ) {
				this.focus = true;
				this.focus_coord.x = this.event.pageX;
				this.focus_coord.y = this.event.pageY;
				this._last_drag_time = time;
			}*/
			return;
		}
		clearTimeout(this._focus_t);
		this._focus_t = false;
		this._last_drag_position = this.compare_area_position;
		this._last_coord.x = this.event.pageX;
		this._last_coord.y = this.event.pageY;
		this._last_drag_time = time;
		
		// If focused, try to see if we need to out focus it
		if ( this.focus ) {
			var focus_distance = Math.sqrt(Math.pow(this.event.pageX-this.focus_coord.x, 2) + Math.pow(this.event.pageY-this.focus_coord.y, 2));
			if ( focus_distance > ed.focus_out_distance ) {
				this.focus = false;
			}
		}
	},
	
	update_current_drop_point: function () {
		var that = this,
			drops_area = _.map(this.drops, function(each){
				if ( each.region._id != that.current_region._id ) return false;
				var area = that.get_area_compared(each);
				return {
					area: area,
					drop: each
				};
			}).filter(function(each){
				if ( each !== false ) return true;
				return false;
			}),
			max_drop = _.max(drops_area, function(each){ return each.area; })
		;

		if ( max_drop.area > 0 ){
			var max_drops = _.filter(drops_area, function(each){ return each.area == max_drop.area; }),
				max_drops_sort = _.sortBy(max_drops, function(each, index, list){
					var priority_area = each.drop.priority ? that.get_area_compared(each.drop.priority) : 0;
					if ( priority_area*1 >= each.area ) return each.drop.priority.index;
					return each.drop.priority_index;
				}),
				drop = _.first(max_drops_sort).drop
			;
		}
		else {
			var drop = _.find(this.drops, function(each){
				return each.is_me;
			});
		}
		this.select_drop_point(drop);
		this.update_drop_position();
	},
	
	update_drop_position: function () {
		if ( !this.drop ) return;
		var ed = this.ed,
			drop = this.drop,
			col = this.current_region ? this.current_region.col : this.me.col,
			is_spacer = this.$me.hasClass('upfront-module-spacer'),
			wrap_only = this.$wrap.find(this.module_selector).length == 1,
			drop_priority_top = drop.priority ? drop.priority.top-drop.top : 0,
			drop_priority_left = drop.priority ? drop.priority.left-drop.left : 0,
			expand_lock = drop.region.$el.hasClass('upfront-region-expand-lock'),
			drop_row = ( drop.priority ? drop.priority.bottom-drop.priority.top+1 : drop.bottom-drop.top+1 );
		this.drop_top = 0;
		this.drop_left = 0;
		// drop_col is calculated based of it's position
		if ( drop.is_me || ( drop.me_in_row && wrap_only ) || is_spacer ){
			this.drop_col = this.me.col;
		}
		else {
			if ( drop.type == 'side-before' || drop.type == 'side-after' ) {
				var distribute = this.find_column_distribution(drop.row_wraps, (drop.me_in_row && wrap_only), true, this.current_area_col, false);
				this.drop_col = distribute.apply_col;
			}
			else {
				this.drop_col = drop.priority ? drop.priority.right-drop.priority.left+1 : drop.right-drop.left+1;
			}
		}

		/*if ( this.is_group ) {
			var original_col = this.model.get_property_value_by_name('original_col');
			if ( _.isNumber(original_col) && original_col > col ) {
				col = original_col;
			}
		}
		this.drop_col = this.drop_col <= col ? this.drop_col : col;*/

		//adjust_bottom = false;
		adjust_bottom = true;

		if ( ed.show_debug_element ){
			$('#upfront-compare-area').css({
				top: (this.compare_area.top-1) * ed.baseline,
				left: (this.compare_area.left-1) * ed.col_size + (ed.grid_layout.left-ed.grid_layout.layout_left),
				width: (this.compare_area.right-this.compare_area.left+1) * ed.col_size,
				height: (this.compare_area.bottom-this.compare_area.top+1) * ed.baseline
			}).text(
				'('+this.compare_area.left+','+this.compare_area.right+') '+
				'('+this.compare_area.top+','+this.compare_area.bottom+')'
			);
		}
	},
	
	/**
	 * Finding the region we currently on
	 */
	update_current_region: function () {
		var that = this,
			ed = this.ed,
			$last_region_container = $('.upfront-region-container-wide, .upfront-region-container-clip').not('.upfront-region-container-shadow').last(),
			regions_area = _.map(ed.regions, function(each){
				var top, bottom, left, right, area,
					is_same_container = ( each.$el.closest('.upfront-region-container').get(0) == $last_region_container.get(0) ),
					region_bottom = ( is_same_container && ( !each.$el.hasClass('upfront-region-side') || each.$el.hasClass('upfront-region-side-left') || each.$el.hasClass('upfront-region-side-right') ) ) ? 999999 : each.grid.bottom, // Make this bottom-less if it's in the last region container
					is_active = each.$el.hasClass('upfront-region-drag-active'),
					is_sub_h = each.$el.hasClass('upfront-region-side-top') || each.$el.hasClass('upfront-region-side-bottom'),
					area = that.get_area_compared({
						top: each.grid.top - 5,
						bottom: region_bottom + 5,
						left: each.grid.left,
						right: each.grid.right
					}),
					type = each.$el.data('type'),
					priority = ed.region_type_priority[type]
				;
				area *= priority;
				if ( is_sub_h ) area *= 2;
				if ( is_active ) area *= 1.5;
				return {
					area: area,
					region: each
				};
			}),
			max_region = _.max(regions_area, function(each){ return each.area; })
		;

		if ( max_region.area > 0 && max_region.region.$el.get(0) != this.current_region.$el.get(0) ) {
			this.set_current_region(max_region.region);

			// Create drop points on the new region
			ed.update_position_data(this.$current_container, false);
			this.create_drop_point();
		}


		if ( ed.show_debug_element ){
			_.each(regions_area, function(r){
				r.region.$el.find('>.upfront-debug-info').text(r.area);
			});
		}
	},
	
	set_current_region: function (region) {
		var regions = this.app.layout.get("regions");
		this.current_region = region && region.$el ? region : this.ed.get_region(this.$region);
		if ( !this.current_region.$el.hasClass('upfront-region-drag-active') ){
			$('.upfront-region-drag-active').removeClass('upfront-region-drag-active');
			this.current_region.$el.addClass('upfront-region-drag-active');
		}
		this.current_region_model = regions.get_by_name(this.current_region.region);
		this.current_wrappers = this.is_parent_group 
			? this.view.group_view.model.get('wrappers') 
			: this.current_region_model.get('wrappers')
		;
		this.$current_container = this.is_parent_group 
			? this.view.group_view.$el.find('.upfront-editable_entities_container:first') 
			: this.current_region.$el.find('.upfront-modules_container > .upfront-editable_entities_container:first')
		;
		this.move_region = ( this.region._id != this.current_region._id );
		if ( !this.is_parent_group ) {
			this.current_area_col = this.current_region.col;
		}
	},
	
	get_area_compared: function (compare) {
		var compare_area = this.compare_area,
			top, bottom, left, right, area;
		if ( compare_area.left >= compare.left && compare_area.left <= compare.right ){
			left = compare_area.left;
		}
		else if ( compare_area.left < compare.left ) {
			left = compare.left;
		}
		else if ( compare_area.left > compare.right && compare_area.left - compare.right <= 1 ) {
			left = compare.right;
		}
		if ( compare_area.right >= compare.left && compare_area.right <= compare.right ) {
			right = compare_area.right;
		}
		else if ( compare_area.right > compare.right ) {
			right = compare.right;
		}
		else if ( compare_area.right < compare.left && compare.left - compare_area.right <= 1 ) {
			right = compare.left;
		}
		if ( compare_area.top >= compare.top && compare_area.top <= compare.bottom ) {
			top = compare_area.top;
		}
		else if ( compare_area.top < compare.top ) {
			top = compare.top;
		}
		if ( compare_area.bottom >= compare.top && compare_area.bottom <= compare.bottom ) {
			bottom = compare_area.bottom;
		}
		else if ( compare_area.bottom > compare.bottom ) {
			bottom = compare.bottom;
		}
		if ( top && bottom && left && right )
			area = (right-left+1) * (bottom-top+1);
		else
			area = 0;
		return area ? area : 0;
	},
	
	render_drop: function () {
		var ed = this.ed,
			breakpoint = this.breakpoint,
			$drop = $('.upfront-drop-use')
		;
		this.wrap_only = ( breakpoint && !breakpoint.default ? true : false );
		if ( !breakpoint || breakpoint.default ) {
			if ( this.drop.type != 'inside' ){
				var wrapper_id = Upfront.Util.get_unique_id("wrapper");
					wrap_model = new Upfront.Models.Wrapper({
						"name": "",
						"properties": [
							{"name": "wrapper_id", "value": wrapper_id},
							{"name": "class", "value": ed.grid.class+this.drop_col}
						]
					}),
					wrap_view = new Upfront.Views.Wrapper({model: wrap_model})
				;
				if ( this.drop.type == 'full' || this.drop.is_clear ) {
					wrap_model.add_class('clr');
				}
				this.current_wrappers.add(wrap_model);
				wrap_view.parent_view = this.view.parent_view;
				this.view.wrapper_view = wrap_view;
				wrap_view.render();
				wrap_view.$el.append(this.view.$el);
				if ( this.drop.type == 'side-before' && this.drop.is_clear ) {
					$drop.nextAll('.upfront-wrapper').eq(0).removeClass('clr');
				}
				$drop.before(wrap_view.$el);
				this.new_wrap_view = wrap_view;
				Upfront.data.wrapper_views[wrap_model.cid] = wrap_view;
				if ( !this.move_region ) {
					// Keep breakpoint data if not moving region
					var prev_wrap_model = this.current_wrappers.get_by_wrapper_id(this.$wrap.attr('id'));
					if ( prev_wrap_model ) {
						wrap_model.set_property('breakpoint', Upfront.Util.clone(prev_wrap_model.get_property_value_by_name('breakpoint')), true);
					}
				}
			}
			else {
				var $drop_wrap = $drop.closest('.upfront-wrapper'),
					wrapper_id = $drop_wrap.attr('id');
				$drop.before(this.view.$el);
			}
			this.wrapper_id = wrapper_id;
			this.model.set_property('wrapper_id', this.wrapper_id, true);

			if ( this.$wrap.find(this.module_selector).length == 0 ){
				if ( this.wrap && this.wrap.grid.left == this.current_region.grid.left ) {
					this.$wrap.nextAll('.upfront-wrapper').eq(0).addClass('clr');
				}
				this.$wrap.remove();
				this.wrap_only = true;
			}
		}
	},
	
	update_models: function () {
		var that = this,
			ed = this.ed,
			breakpoint = this.breakpoint,
			wrappers = this.current_wrappers,
			$me = this.$me,
			$wrap = this.$wrap,
			region_view = Upfront.data.region_views[this.current_region_model.cid]
		;
		// normalize clear
		_.each(ed.wraps, function(each){
			var breakpoint_clear = ( !breakpoint || breakpoint.default ) ? each.$el.hasClass('clr') : each.$el.data('breakpoint_clear');
			each.$el.data('clear', breakpoint_clear ? 'clear' : 'none');
		});
		if ( !this.drop.is_me && this.drop.type == 'side-before' ) {
			var $next_wrap = this.drop.insert[1];
			if ( $next_wrap.size() > 0 ){
				var next_wrap = ed.get_wrap($next_wrap),
					next_wrap_clr = ( !breakpoint || breakpoint.default ) ? $next_wrap.hasClass('clr') : $next_wrap.data('breakpoint_clear');
				if ( ! next_wrap_clr || this.drop.is_clear ){
					$next_wrap.data('clear', 'none');
				}
			}
		}
		
		ed.update_model_margin_classes( $me, [ed.grid.class + this.drop_col] );

		// Remove breakpoint value if dropped to inside/move to other region
		if ( this.drop.type == 'inside' || this.move_region ) {
			var wrap_model = this.current_wrappers.get_by_wrapper_id($wrap.attr('id'));
			if ( wrap_model ) {
				wrap_model.remove_property('breakpoint', true);
			}
			this.model.remove_property('breakpoint', true);
		}
		
		// If the drop is to side, also update the elements on the same row
		if ( 
			!this.drop.is_me 
			&& 
			( !this.drop.me_in_row || !this.wrap_only ) 
			&& 
			( this.drop.type == 'side-before' || this.drop.type == 'side-after' ) 
		) {
			var distribute = this.find_column_distribution(this.drop.row_wraps, false, true, this.current_area_col, false),
				remaining_col = distribute.remaining_col - (this.drop_col-distribute.apply_col),
				apply_index = 0,
				first_is_spacer = false,
				me_clear = false
			;
			_.each(this.drop.row_wraps, function (row_wrap) {
				row_wrap.$el.find(that.module_selector).each(function () {
					if ( $(this).hasClass('upfront-module-spacer') ) {
						var wrap_model = wrappers.get_by_wrapper_id(row_wrap.$el.attr('id')),
							this_model = ed.get_el_model($(this));
						wrappers.remove(wrap_model);
						that.model.collection.remove(this_model);
						if ( apply_index == 0 ) {
							first_is_spacer = true;
							if ( ( that.drop.type == 'side-after' || that.drop.type == 'side-before' ) && that.drop.insert[1].get(0) == row_wrap.$el.get(0) ) {
								// First is removed spacer and we drop before/after that spacer, means we now drop to the first
								me_clear = true;
							}
						}
					}
					else {
						var apply_col = distribute.apply_col;
						// Distribute remaining_col
						if ( remaining_col > 0 ) {
							apply_col += 1;
							remaining_col -= 1;
						}
						ed.update_model_margin_classes( $(this), [ed.grid.class + apply_col] );
						if ( apply_index == 1 && first_is_spacer ) {
							if ( that.drop.type == 'side-before' && that.drop.insert[1].get(0) == row_wrap.$el.get(0) ) {
								// First is removed spacer and we drop before the first element, means we now drop to the first
								me_clear = true;
							}
							else if ( !me_clear ) {
								// First is removed spacer and now this wrapper is the first instead, if we don't drop to the first
								row_wrap.$el.data('clear', 'clear');
							}
						}
					}
					apply_index++;
				});
			});
			if ( me_clear ) {
				if ( that.new_wrap_view !== false ) {
					that.new_wrap_view.$el.data('clear', 'clear');
				}
				else {
					that.$wrap.data('clear', 'clear');
				}
			}
		}
		
		// Also try to distribute columns if the element was moved away and leave empty spaces in previous place
		if ( !this.drop.is_me && !this.drop.me_in_row && this.wrap_only ) {
			if ( this.current_row_wraps && !_.isEqual(this.drop.row_wraps, this.current_row_wraps) ) {
				var distribute = this.find_column_distribution(this.current_row_wraps, true, false, this.area_col),
					remaining_col = distribute.remaining_col
				;
				if ( distribute.total > 0 ) {
					_.each(this.current_row_wraps, function (row_wrap) {
						if ( that.wrap.$el.get(0) == row_wrap.$el.get(0) ) return;
						row_wrap.$el.find(that.module_selector).each(function () {
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
					_.each(this.current_row_wraps, function (row_wrap) {
						if ( that.wrap.$el.get(0) == row_wrap.$el.get(0) ) return;
						row_wrap.$el.find(that.module_selector).each(function () {
							if ( !$(this).hasClass('upfront-module-spacer') ) return;
							var wrap_model = wrappers.get_by_wrapper_id(row_wrap.$el.attr('id')),
								this_model = ed.get_el_model($(this));
							wrappers.remove(wrap_model);
							that.model.collection.remove(this_model, {update: false});
						});
					});
				}
			}
		}
		
		if ( this.is_parent_group ) {
			ed.update_wrappers(this.view.group_view.model, this.view.group_view.$el);
		}
		else {
			ed.update_wrappers(this.current_region_model, this.current_region.$el);
		}

		if ( this.move_region ) {
			ed.update_model_margin_classes( this.$container.find('.upfront-wrapper').find(this.module_selector) );
			ed.update_wrappers(this.region_model, this.region.$el);
		}

		if ( !breakpoint || breakpoint.default ){
			if ( !this.move_region ){
				// Preserve breakpoint order to prevent element shifting due to changing position in collection
				this.view.parent_view.preserve_wrappers_breakpoint_order();
				this.view.resort_bound_collection();
				// Normalize child spacers
				this.view.parent_view.normalize_child_spacing();
			}
			else {
				var modules = this.current_region_model.get('modules'),
					models = []
				;
				// Preserve breakpoint order to prevent element shifting due to changing position in collection
				this.view.region_view._modules_view.preserve_wrappers_breakpoint_order();
				this.model.collection.remove(this.model, {silent: true});
				if ( this.model.get('shadow') ){
					this.view.trigger('on_layout');
					this.model.unset('shadow', {silent: true});
				}
				// Normalize child spacers
				this.view.region_view._modules_view.normalize_child_spacing();

				region_view._modules_view.preserve_wrappers_breakpoint_order();
				$me.removeAttr('data-shadow');
				this.$current_container.find('.upfront-wrapper').find(this.module_selector).each(function(){
					var element_id = $(this).attr('id'),
						each_model = modules.get_by_element_id(element_id);
					if ( !each_model && element_id == $me.attr('id') ) {
						models.push(that.model);
					}
					else if ( each_model ) {
						models.push(each_model);
					}
				});
				modules.reset(models);
			}
		}
		else {
			var orders = [],
				index = 0,
				is_drop_wrapper = ( this.drop.type != 'inside' ),
				$els = is_drop_wrapper
					? Upfront.Util.find_sorted(this.$current_container, '> .upfront-wrapper')
					: Upfront.Util.find_sorted($me.closest('.upfront-wrapper'), this.module_selector)
				,
				inside_length = !is_drop_wrapper ? $me.closest('.upfront-wrapper').find(this.module_selector).length : 0,
				insert_index = false
			;
			if ( !this.drop.is_me && this.drop.insert[0] == 'append' && is_drop_wrapper ) {
				insert_index = $els.length-1;
			}
			$els.each(function(){
				var each_el = is_drop_wrapper ? ed.get_wrap($(this)) : ed.get_el($(this));
				if ( !each_el ) return; // Doesn't exists, means it's not relevant to current breakpoint
				if ( insert_index === index ) index++;
				if ( !that.drop.is_me && that.drop.insert[0] == 'append' ) {
					if ( !is_drop_wrapper && insert_index === false && $(this).closest('.upfront-wrapper').get(0) == that.drop.insert[1].get(0) ){
						insert_index = index + inside_length - 1;
					}
					if ( ( is_drop_wrapper && $wrap.get(0) == this ) || ( !is_drop_wrapper && $me.get(0) == this ) ){
						index--;
					}
				}
				if ( !that.drop.is_me && that.drop.insert[1].get(0) == this ){
					if ( that.drop.insert[0] == 'before' ){
						insert_index = index;
						orders.push({
							$el: $(this),
							order: index+1,
							clear: ( that.drop.type != 'side-before' )
						});
					}
					else if ( that.drop.type == 'side-after' && that.drop.insert[0] == 'after' ){
						insert_index = index+1;
						orders.push({
							$el: $(this),
							order: index,
							clear: ( each_el.outer_grid.left == that.current_region.grid.left ) // @TODO: does it work correctly with group?
						});
					}
					index++;
				}
				else {
					orders.push({
						$el: $(this),
						order: index,
						clear: ( each_el.outer_grid.left == that.current_region.grid.left ) // @TODO: does it work correctly with group?
					});
				}
				index++;
			});
			_.each(orders, function(each_el){
				var id = each_el.$el.attr('id'),
					each_model = is_drop_wrapper ? wrappers.get_by_wrapper_id(id) : ed.get_el_model(each_el.$el),
					model_breakpoint, model_breakpoint_data
				;
				if ( !each_model ) return;
				if ( 
					( is_drop_wrapper && each_el.$el.get(0) == $wrap.get(0) ) 
					|| 
					( !is_drop_wrapper && each_el.$el.get(0) == $me.get(0) ) 
				){
					each_el.order = insert_index !== false ? insert_index : each_el.order;
					each_el.clear = that.drop.is_clear;
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
		ed.update_position_data(this.$current_container);
		ed.normalize(ed.els, ed.wraps);
	},
	
	update_views: function () {
		var view = this.view,
			model = this.model
		;
		if ( this.move_region ){
			view.region = this.current_region_model;
			view.region_view = Upfront.data.region_views[view.region.cid];
			view.parent_view = view.region_view._modules_view;
			this.new_wrap_view.parent_view = view.parent_view;
			if ( !_.isUndefined(view._modules_view) ) { // this is grouped modules, also fix the child views
				view._modules_view.region_view = view.region_view;
				if ( !_.isUndefined(model.get('modules')) ){
					model.get('modules').each(function(child_module){
						var child_view = Upfront.data.module_views[child_module.cid];
						if ( !child_view ) return;
						child_view.region = view.region;
						child_view.region_view = view.region_view;
					});
				}
			}
			view.trigger('region:updated');
		}
	},
	
	clean_elements: function () {
		$('.upfront-drop').remove();
		$('.upfront-drop-view').remove();
		$('#upfront-compare-area').remove();

		this.$me.css({
			'position': '',
			'top': '',
			'left': '',
			'z-index': '',
			'visibility': 'visible'
		});
		
		this.$wrap.css('min-height', '');
		this.$current_container.find('.upfront-wrapper').find(this.module_selector).css('max-height', '');
		$('.upfront-region-drag-active').removeClass('upfront-region-drag-active');
		this.$main.removeClass('upfront-dragging');
	},
	
	reset: function () {
		this.drop_areas_created = [];
		this.drops = [];
		this.drop = false;
	},
	
	find_column_distribution: function (row_wraps, me_in_row, add, area_col, count_spacer) {
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
	
	
	show_debug_data: function () {
		if ( !this.ed.show_debug_element ) return;
		var ed = this.ed,
			$layout = this.$layout,
			$helper = this.$helper
		;
		_.each(ed.els, function(each){
			each.$el.find(".upfront-debug-info").size() || each.$el.find('.upfront-editable_entity:first').append('<div class="upfront-debug-info"></div>');
			each.$el.find(".upfront-debug-info").text(
				'grid: ('+each.grid.left+','+each.grid.right+'),'+'('+each.grid.top+','+each.grid.bottom+') | '+
				'outer: ('+each.outer_grid.left+','+each.outer_grid.right+'),('+each.outer_grid.top+','+each.outer_grid.bottom+') | '+
				'center: '+each.grid_center.x+','+each.grid_center.y
			);
		});
		_.each(this.drops, function(each){
			//each.$el.append('<div class="upfront-drop-debug">('+each.left+','+each.top+'),('+each.right+','+each.bottom+')</div>');
			var $view = $('<div class="upfront-drop-view"><div class="upfront-drop-priority-view"></div><span class="upfront-drop-view-pos"></span></div>');
			$view.addClass('upfront-drop-view-'+each.type);
			if ( each.is_me ) {
				$view.addClass('upfront-drop-view-me');
			}
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
	}
}


return DragDrop;

});
	
})(jQuery);
//@ sourceURL=dragdrop.js