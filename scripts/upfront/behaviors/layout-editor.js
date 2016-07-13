(function ($) {

var LayoutEditor = {
	selection: [], // store selection
	selecting: false, // true when selecting start, false when stopped
	create_mergeable: function (view, model) {
		var app = this,
			ed = Upfront.Behaviors.LayoutEditor,
			regions = app.layout.get('regions')
		;
		view.$el.selectable({
			distance: 10, // Prevents global click hijack
			filter: ".upfront-module",
			cancel: ".upfront-module:not(.upfront-module-spacer), .upfront-module-group, .upfront-region-side-fixed, .upfront-entity_meta, .upfront-region-edit-trigger, .upfront-region-edit-fixed-trigger, .upfront-region-finish-edit, .upfront-icon-control-region-resize, .upfront-inline-modal, .upfront-inline-panels",
			selecting: function (e, ui) {
				var $el = $(ui.selecting),
					$region, $selected, $affected, group, do_select;
				// make sure it's not inside module group
				if ( $el.closest('.upfront-module-group').length > 0 ) return;
				if ( ed.selection.length > 0 ){
					// if we already have at least one selection, check if the next selection is mergeable or not
					// make sure it's in the same region
					$region = $(ed.selection[0]).closest('.upfront-region');
					if ( $el.closest('.upfront-region').get(0) != $region.get(0) ) return;
					ed._add_selections( $region.find('.ui-selecting'), $region.find('.upfront-module').not('.upfront-ui-selected, .upfront-module-parent-group'), $region.find('.upfront-module-group') );
				}
				else {
					ed._add_selection(ui.selecting);
				}
				ed._update_selection_outline();
			},
			unselecting: function (e, ui) {
				var $el = $(ui.unselecting),
					$region, $selected
				;
				if ( ed.selection.length > 1 ){
					$region = $(ed.selection[0]).closest('.upfront-region');
					if ( $el.closest('.upfront-region').get(0) != $region.get(0) ) return;
					$('.upfront-ui-selected').each(function(){
						ed._remove_selection(this);
					});
					$selected = $region.find('.ui-selecting');
					if ( $selected.length > 0 ) {
						ed._add_selection($selected.get(0));
						ed._add_selections( $selected, $region.find('.upfront-module').not('.upfront-ui-selected, .upfront-module-parent-group'), $region.find('.upfront-module-group') );
					}

					ed._update_selection_outline();
					return;
				}
				ed._remove_selection(ui.unselecting);
				ed._update_selection_outline();
			},
			/*selected: function (e, ui) {
				var $el = $(ui.selected);
				$el.prepend('<div class="upfront-selected-border" />');
			},*/
			unselected: function (e, ui) {
				var $el = $(ui.unselected);
				$el.find('.upfront-selected-border').remove();
				$('.upfront-module-group-group').remove();
			},
			start: function (e, ui) {
				// reset selection on start
				ed.remove_selections();
				ed.selection = [];
				ed.selecting = true;
			},
			stop: function (e, ui) {
				ed.parse_selections();
			}
		});
	},

	refresh_mergeable: function () {
		this.remove_selections();
		$(".ui-selectable").each(function () {
			$(this).selectable("refresh");
		});
	},

	enable_mergeable: function () {
		this.remove_selections();
		$(".ui-selectable").each(function () {
			$(this).selectable("enable");
		});
	},

	disable_mergeable: function () {
		this.remove_selections();
		$(".ui-selectable").each(function () {
			$(this).selectable("disable");
		});
	},

	destroy_mergeable: function () {
		this.remove_selections();
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
	},

	parse_selections: function () {
		if ( !$(".upfront-ui-selected").length )
			return false;

		// Disable Grouping
		if (!Upfront.Application.user_can_modify_layout()) return false;

		var ed = this,
			regions = Upfront.Application.layout.get('regions'),
			$region = $(".upfront-ui-selected:first").closest('.upfront-region'),
			region = regions.get_by_name($region.data('name')),
			region_modules = (region ? region.get("modules") : false),
			region_wrappers = (region ? region.get("wrappers") : false),
			unselect = function(){
				$(this).find('.upfront-selected-border').remove();
				$(this).removeClass('upfront-ui-selected ui-selected');
			},
			$selected = $('.upfront-ui-selected');
		if ($selected.length < 2){
			$selected.each(function(){
				ed._remove_selection(this);
			});
			$('#upfront-group-selection').remove();
			return false;
		}
		$('.upfront-module-group-group').remove();
		var $group = $('<div class="upfront-module-group-toggle upfront-module-group-group">' + Upfront.Settings.l10n.global.behaviors.group + '</div>'),
			sel_top = sel_left = sel_right = sel_bottom = false,
			wrap_top = wrap_left = wrap_right = wrap_bottom = false,
			group_top = group_left = 0;
		$('body').append($group);
		$selected.each(function(){
			var off = $(this).offset(),
				width = $(this).outerWidth(),
				height = $(this).outerHeight(),
				$wrap = $(this).closest('.upfront-wrapper'),
				wrap_off = $wrap.offset(),
				wrap_width = $wrap.outerWidth(),
				wrap_height = $wrap.outerHeight()
			;
			off.right = off.left + width;
			off.bottom = off.top + height;
			sel_top = ( sel_top === false || off.top < sel_top ) ? off.top : sel_top;
			sel_bottom = ( sel_bottom === false || off.bottom > sel_bottom ) ? off.bottom : sel_bottom;
			sel_left = ( sel_left === false || off.left < sel_left ) ? off.left : sel_left;
			sel_right = ( sel_right === false || off.right > sel_right ) ? off.right : sel_right;
			wrap_off.right = wrap_off.left + wrap_width;
			wrap_off.bottom = wrap_off.top + wrap_height;
			wrap_top = ( wrap_top === false || wrap_off.top < wrap_top ) ? wrap_off.top : wrap_top;
			wrap_bottom = ( wrap_bottom === false || wrap_off.bottom > wrap_bottom ) ? wrap_off.bottom : wrap_bottom;
			wrap_left = ( wrap_left === false || wrap_off.left < wrap_left ) ? wrap_off.left : wrap_left;
			wrap_right = ( wrap_right === false || wrap_off.right > wrap_right ) ? wrap_off.right : wrap_right;
		});
		group_top = sel_top + Math.round( (sel_bottom-sel_top)/2 ) - Math.round( $group.outerHeight()/2 );
		group_left = sel_left + Math.round( (sel_right-sel_left)/2 ) - Math.round( $group.outerWidth()/2 );
		$group.css({
			position: 'absolute',
			zIndex: 999999,
			top: group_top,
			left: group_left
		});
		setTimeout(function(){ ed.selecting = false; }, 1000);
		$group.on('click', function () {
			var breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
				grid_ed = Upfront.Behaviors.GridEditor,
				first_module_view = false,
				max_col = Math.round((wrap_right-wrap_left)/grid_ed.grid.column_width),
				lines = grid_ed.parse_modules_to_lines(region_modules, region_wrappers, breakpoint.id, breakpoint.columns),
				group_lines = [],
				prev_group_lines = [],
				next_group_lines = [],
				is_prev_group_combine = false,
				is_next_group_combine = false,
				group_col = 0,
				prev_group_col = 0,
				next_group_col = 0,
				do_split = false
				;
			// Parse the lines into groups
			_.each(lines, function (l) {
				var wrappers = [],
					prev_wrappers = [],
					next_wrappers = [],
					top_wrappers = [],
					bottom_wrappers = [],
					line_col = 0,
					prev_line_col = 0,
					next_line_col = 0
					;
				_.each(l.wrappers, function (w) {
					var modules = [],
						top_modules = [],
						bottom_modules = []
						;
					_.each(w.modules, function (m) {
						var found = false;
						$selected.each(function () {
							var element_id = $(this).attr('id'),
								index;
							if ( m.model.get_element_id() == element_id ) {
								if ( first_module_view === false ) {
									first_module_view = Upfront.data.module_views[m.model.cid];
								}
								modules.push(m);
								found = true;
							}
						});
						if ( !found ) {
							if ( modules.length == 0 ) {
								top_modules.push(m);
							}
							else {
								bottom_modules.push(m);
							}
						}
					});
					if ( modules.length > 0 ) {
						wrappers.push({
							modules: modules,
							top_modules: top_modules,
							bottom_modules: bottom_modules,
							model: w.model,
							col: w.col,
							clear: w.clear,
							spacer: w.spacer,
							order: w.order
						});
						line_col += w.col;
						if ( top_modules.length ) {
							top_wrappers.push({
								modules: top_modules,
								model: w.model,
								col: w.col,
								clear: w.clear,
								spacer: w.spacer,
								order: w.order
							});
						}
						if ( bottom_modules.length ) {
							bottom_wrappers.push({
								modules: bottom_modules,
								model: w.model,
								col: w.col,
								clear: w.clear,
								spacer: w.spacer,
								order: w.order
							});
						}
					}
					else {
						( wrappers.length == 0 ? prev_wrappers : next_wrappers ).push({
							modules: w.modules,
							model: w.model,
							col: w.col,
							clear: w.clear,
							spacer: w.spacer,
							order: w.order
						});
						if ( wrappers.length == 0 ) prev_line_col += w.col;
						else next_line_col += w.col;
					}
				});
				if ( wrappers.length > 0 ) {
					group_lines.push({
						wrappers: wrappers,
						top_wrappers: top_wrappers,
						bottom_wrappers: bottom_wrappers,
						col: line_col
					});
					group_col = line_col > group_col ? line_col : group_col;
					if ( prev_wrappers.length > 0 ) {
						prev_group_lines.push({
							wrappers: prev_wrappers,
							col: prev_line_col
						});
						prev_group_col = prev_line_col > prev_group_col ? prev_line_col : prev_group_col;
					}
					if ( next_wrappers.length > 0 ) {
						next_group_lines.push({
							wrappers: next_wrappers,
							col: next_line_col
						});
						next_group_col = next_line_col > next_group_col ? next_line_col : next_group_col;
					}
				}
			});
			grid_ed.start(first_module_view, first_module_view.model);

			// Grouping!
			// Try to see if previous elements qualify to be grouped/combined (that is if it has > 1 line)
			if ( prev_group_lines.length > 1 ) {
				if ( !ed._do_combine(prev_group_lines, region) ) {
					ed._do_group(prev_group_lines, region);
				}
			}
			// If we don't have affected previous/next elements, we'll split non-selected element outside group
			// Otherwise, it creates another group
			if ( prev_group_lines.length == 0 && next_group_lines.length == 0 ) {
				do_split = true;
			}
			ed._do_group(group_lines, region, false, do_split);
			// Try to see if next elements qualify to be grouped/combined (that is if it has > 1 line)
			if ( next_group_lines.length > 1 ) {
				if ( !ed._do_combine(next_group_lines, region) ) {
					ed._do_group(next_group_lines, region);
				}
			}

			// now normalize the wrappers
			grid_ed.update_position_data($region.find('.upfront-editable_entities_container:first'));
			grid_ed.update_wrappers(region);

			$(this).remove();
			$('#upfront-group-selection').remove();
			ed.selection = [];
		});
	},

	_do_group: function (lines, region, force_add_wrapper, do_split)  {
		var ed = this,
			grid_ed = Upfront.Behaviors.GridEditor,
			add_wrapper = (force_add_wrapper === true),
			do_split = ( do_split === true ),
			region_modules = region.get("modules"),
			region_wrappers = region.get("wrappers"),
			group_id = Upfront.Util.get_unique_id("module-group"),
			group = new Upfront.Models.ModuleGroup(),
			group_view = false,
			group_modules = group.get('modules'),
			group_wrappers = group.get('wrappers'),
			group_wrapper_clear = false,
			group_wrapper = false,
			group_wrapper_id = false,
			group_col = 0,
			add_index = false,
			top_add_index = false,
			breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled()
		;
		_.each(lines, function (l, li) {
			group_col = l.col > group_col ? l.col : group_col;
			_.each(l.wrappers, function (w, wi) {
				var new_wrapper = new Upfront.Models.Wrapper({}),
					new_wrapper_id = Upfront.Util.get_unique_id("wrapper"),
					wrapper_view = Upfront.data.wrapper_views[w.model.cid],
					has_top_modules = ( 'top_modules' in w && w.top_modules.length > 0 ),
					has_bottom_modules = ( 'bottom_modules' in w && w.bottom_modules.length > 0 )
				;
				new_wrapper.set_property('wrapper_id', new_wrapper_id);
				new_wrapper.set_property('class', w.model.get_property_value_by_name('class'));
				new_wrapper.replace_class(grid_ed.grid['class'] + w.col);
				if ( wi == 0 ) {
					new_wrapper.add_class('clr');
					if ( li == 0 ) {
						group_wrapper_clear = w.clear;
					}
				}
				group_wrappers.add(new_wrapper);
				_.each(w.modules, function (m, mi) {
					var index = region_modules.indexOf(m.model),
						view = Upfront.data.module_views[m.model.cid]
					;
					if ( add_index === false ) {
						add_index = index;
					}
					m.model.set_property('wrapper_id', new_wrapper_id, true);
					region_modules.remove(m.model, {silent: true});
					view.$el.detach(); // Detach element from DOM, will render later with group render
					if ( !has_top_modules && !has_bottom_modules ) {
						wrapper_view.$el.detach(); // Detach wrapper view from DOM too
					}
					group_modules.add(m.model);
				});
				if ( li == 0 && wi == 0 ) {
					// First wrapper is now used for group wrapper
					group_wrapper_id = w.model.get_wrapper_id();
					group_wrapper = w.model;
				}
				else if ( !has_top_modules ) {
					// Unused wrapper, remove
					region_wrappers.remove(w.model);
				}
			});
			if ( 'bottom_wrappers' in l && l.bottom_wrappers.length > 1 ) {
				// Has bottom wrappers, let's group that too
				if ( do_split ) {
					ed._do_split(l.bottom_wrappers, region);
				}
				else {
					ed._do_group([{
						wrappers: l.bottom_wrappers,
						col: l.col
					}], region);
				}
			}
			if ( 'top_wrappers' in l && l.top_wrappers.length > 1 ) {
				// Has top wrappers, let's group that too, create new wrapper instead
				if ( do_split ) {
					// We don't actually split the top wrappers, the group will be render below that
					// But we need to fix the element position
					_.each(l.top_wrappers, function (w, wi) {
						_.each(w.modules, function (m, mi) {
							var index = region_modules.indexOf(m.model);
							if ( top_add_index === false ) {
								top_add_index = index;
								return;
							}
							region_modules.remove(m.model, {silent: true});
							top_add_index++;
							m.model.add_to(region_modules, top_add_index);
						});
					});
					if ( top_add_index !== false ) {
						add_index = top_add_index+1;
					}
					add_wrapper = true;
				}
				else {
					ed._do_group([{
						wrappers: l.top_wrappers,
						col: l.col
					}], region);
				}
			}
		});
		if ( add_wrapper ) {
			group_wrapper = new Upfront.Models.Wrapper({});
			group_wrapper_id = Upfront.Util.get_unique_id("wrapper");
			region_wrappers.add(group_wrapper);
		}
		group_wrapper.set_property('wrapper_id', group_wrapper_id);
		group_wrapper.replace_class(grid_ed.grid['class'] + group_col);
		if ( group_wrapper_clear ){
			group_wrapper.add_class('clr');
		}
		group.set_property('wrapper_id', group_wrapper_id);
		group.set_property('element_id', group_id);
		group.replace_class(grid_ed.grid['class'] + group_col);
		group.set_property('original_col', group_col);
		// Let's try to update breakpoint data as needed too
		var wrapper_data = group_wrapper && group_wrapper.get_property_value_by_name('breakpoint') || {},
			data = group.get_property_value_by_name('breakpoint') || {}
		;
		_.each(breakpoints, function(each){
			var breakpoint = each.toJSON();
			if ( breakpoint['default'] ) return;
			if ( wrapper_data && wrapper_data[breakpoint.id] && wrapper_data[breakpoint.id].edited ) {
				if ( ! _.isObject(data[breakpoint.id]) ) {
					data[breakpoint.id] = { edited: false };
				}
				// Wrapper is edited in this breakpoint, let's apply columns from wrapper for this breakpoint
				if ( !data[breakpoint.id].edited && _.isNumber(wrapper_data[breakpoint.id].col) ) {
					data[breakpoint.id].col = wrapper_data[breakpoint.id].col;
					data[breakpoint.id].edited = true;
					group.set_property('breakpoint', Upfront.Util.clone(data));
				}
			}
		});
		group.add_to(region_modules, add_index);
		Upfront.Events.trigger("entity:module_group:group", group, region);
	},

	_do_combine: function (lines, region) {
		var ed = this,
			grid_ed = Upfront.Behaviors.GridEditor,
			region_modules = region.get("modules"),
			region_wrappers = region.get("wrappers"),
			wrappers_col = [],
			wrappers_combine = [],
			can_combine = true
		;
		_.each(lines, function (l, li) {
			if ( !(li in wrappers_col) ) wrappers_col[li] = [];
			_.each(l.wrappers, function (w, wi) {
				if ( !(wi in wrappers_combine) ) wrappers_combine[wi] = [];
				wrappers_col[li][wi] = w.col;
				wrappers_combine[wi].push(w);
			});
		});
		// Check if it's possible to combine modules to the same wrapper
		if ( wrappers_col.length > 1 ) {
			for ( var i = 1; i < wrappers_col.length; i++ ) {
				if ( !_.isEqual(wrappers_col[i-1], wrappers_col[i]) ) {
					can_combine = false;
					break;
				}
			}
		}
		if ( !can_combine ) return false;
		_.each(wrappers_combine, function (combine) {
			var add_index = 0,
				spacers = _.filter(combine, function(w){ return w.spacer; }),
				all_spacers = ( combine.length == spacers.length ),
				wrapper_id
			;
			_.each(combine, function (w, wi) {
				if ( wi == 0 ) {
					// The first wrapper which we'll use for combine
					wrapper_id = w.model.get_wrapper_id();
					add_index = region_modules.indexOf(_.last(w.modules).model);
					if ( w.spacer && !all_spacers ) {
						// It's spacer but we have other element below, so just remove this spacer
						_.each(w.modules, function (m) {
							region_modules.remove(m.model);
						});
						add_index--;
					}
					return;
				}
				region_wrappers.remove(w.model);
				if ( w.spacer ) {
					_.each(w.modules, function (m) {
						region_modules.remove(m.model);
					});
				}
				else {
					_.each(w.modules, function (m, mi) {
						m.model.set_property('wrapper_id', wrapper_id, true);
						region_modules.remove(m.model, {silent: true});
						add_index++;
						m.model.add_to(region_modules, add_index);
					});
				}
			});
		});
		return true;
	},

	_do_split: function (wrappers, region) {
		var ed = this,
			grid_ed = Upfront.Behaviors.GridEditor,
			region_modules = region.get("modules"),
			region_wrappers = region.get("wrappers")
		;
		_.each(wrappers, function (w, wi) {
			var new_wrapper = new Upfront.Models.Wrapper({}),
				new_wrapper_id = Upfront.Util.get_unique_id("wrapper")
			;
			new_wrapper.set_property('wrapper_id', new_wrapper_id);
			new_wrapper.set_property('class', w.model.get_property_value_by_name('class'));
			region_wrappers.add(new_wrapper);
			_.each(w.modules, function (m, mi) {
				var index = region_modules.indexOf(m.model);
				m.model.set_property('wrapper_id', new_wrapper_id, true);
				region_modules.remove(m.model, {silent: true});
				m.model.add_to(region_modules, index);
			});
		});
		return true;
	},

	_get_group_position: function ($selected) {
		var sel_top = sel_left = sel_right = sel_bottom = false,
			wrap_top = wrap_left = wrap_right = wrap_bottom = false
		;
		$selected.each(function(){
			var off = $(this).offset(),
				width = Math.round(parseFloat($(this).css('width'))),
				height = Math.round(parseFloat($(this).css('height'))),
				$wrap = $(this).closest('.upfront-wrapper'),
				wrap_off = $wrap.offset(),
				wrap_width = Math.round(parseFloat($wrap.css('width'))),
				wrap_height = Math.round(parseFloat($wrap.css('height')))
			;
			off.left = Math.round(off.left);
			off.top = Math.round(off.top);
			off.right = off.left + width;
			off.bottom = off.top + height;
			sel_top = ( sel_top === false || off.top < sel_top ) ? off.top : sel_top;
			sel_bottom = ( sel_bottom === false || off.bottom > sel_bottom ) ? off.bottom : sel_bottom;
			sel_left = ( sel_left === false || off.left < sel_left ) ? off.left : sel_left;
			sel_right = ( sel_right === false || off.right > sel_right ) ? off.right : sel_right;
			wrap_off.left = Math.round(wrap_off.left);
			wrap_off.top = Math.round(wrap_off.top);
			wrap_off.right = wrap_off.left + wrap_width;
			wrap_off.bottom = wrap_off.top + wrap_height;
			wrap_top = ( wrap_top === false || wrap_off.top < wrap_top ) ? wrap_off.top : wrap_top;
			wrap_bottom = ( wrap_bottom === false || wrap_off.bottom > wrap_bottom ) ? wrap_off.bottom : wrap_bottom;
			wrap_left = ( wrap_left === false || wrap_off.left < wrap_left ) ? wrap_off.left : wrap_left;
			wrap_right = ( wrap_right === false || wrap_off.right > wrap_right ) ? wrap_off.right : wrap_right;
		});
		return {
			element: {
				top: sel_top,
				bottom: sel_bottom,
				left: sel_left,
				right: sel_right
			},
			wrapper: {
				top: wrap_top,
				bottom: wrap_bottom,
				left: wrap_left,
				right: wrap_right
			}
		};
	},

	_find_affected_el: function ($els, pos) {
		if ( this.selection.length == 0 ) return false;
		var $affected = false;
		$els.each(function(){
			var off = $(this).offset(),
				width = Math.round(parseFloat($(this).css('width'))),
				height = Math.round(parseFloat($(this).css('height'))),
				top = Math.round(off.top),
				left = Math.round(off.left),
				bottom = top + height,
				right = left + width
			;
			if ( pos.top < bottom && pos.bottom > top && pos.left < right && pos.right > left ) {
				$affected = $affected !== false ? $affected.add($(this)) : $(this);
			}
		});
		return $affected;
	},

	_update_selection_outline: function () {
		var $selection = $('#upfront-group-selection'),
			group = this._get_group_position($(this.selection));

		if ( !$selection.length ){
			$selection = $('<div id="upfront-group-selection" />');
			$selection.appendTo('body');
		}
		$selection.css({
			top: group.element.top,
			left: group.element.left,
			height: group.element.bottom - group.element.top,
			width: group.element.right - group.element.left
		});
	},

	_add_selection: function (el) {
		var find = _.find(this.selection, function(sel){ return (sel == el); });
		if ( find ) return;
		this.selection.push(el);
		$(el).addClass('upfront-ui-selected');
		//$(el).prepend('<div class="upfront-selected-border" />');
	},

	/**
	 * Automatically resolve conflict on adding multiple selections
	 */
	_add_selections: function ($selecting, $affected_els, $restrict_els) {
		var ed = this,
			selected = [],
			group,
			$affected,
			$restricted
		;
		// Add selection one-by-one
		$selecting.each(function () {
			var el = this,
				find = _.find(ed.selection, function(sel){ return (sel == el); }),
				$affected_els_tmp = $($affected_els)
			;
			if ( find ) return;
			selected = [];
			group = ed._get_group_position( $(ed.selection).add(this) );
			$affected = ed._find_affected_el( $affected_els_tmp, group.element);
			// Find all affected elements by this selection
			while ( $affected !== false ) {
				$affected.each(function(){ selected.push(this); });
				$affected_els_tmp = $affected_els_tmp.not($affected);
				group = ed._get_group_position( $(ed.selection).add(selected) );
				$affected = ed._find_affected_el( $affected_els_tmp, group.element );
			}
			// Make sure no restricted element is on the way
			$restricted = ed._find_affected_el( $restrict_els, group.element );
			if ( $restricted !== false ) return;
			// Safe, now properly add selection
			_.each(selected, function (sel) {
				ed._add_selection(sel);
			});
		});

		return;
	},

	_remove_selection: function (el) {
		this.selection = _.reject(this.selection, function(sel){ return (sel == el); });
		$(el).find('.upfront-selected-border').remove();
		$(el).removeClass('upfront-ui-selected ui-selected');
	},

	remove_selections: function () {
		var ed = Upfront.Behaviors.LayoutEditor;
		$('.upfront-ui-selected').each(function(){
			ed._remove_selection(this);
		});
		ed._update_selection_outline();
		$('.upfront-module-group-group').remove();
	},

	create_undo: function () {
		this.layout.store_undo_state();
	},
	apply_history_change: function () {
		var regions = Upfront.Application.layout.get("regions"),
			region = regions ? regions.get_by_name('shadow') : false
		;
		if (regions && region) { regions.remove(region); region = false; }
		//Upfront.Application.layout_view.local_view = false;
		Upfront.Application.layout_view.render();
	},

	save_dialog: function (on_complete, context, layout_changed, is_archive) {
		$("body").append("<div id='upfront-save-dialog-background' />");
		$("body").append("<div id='upfront-save-dialog' />");
		var $dialog = $("#upfront-save-dialog"),
			$bg = $("#upfront-save-dialog-background"),
			current = Upfront.Application.layout.get("current_layout"),
			html = ''
		;
		is_archive = true === is_archive;

		if ( is_archive ) {
			html += '<p>' + Upfront.Settings.l10n.global.behaviors.this_archive_only + '</p>';
		}
		else {
			html += '<p>' + Upfront.Settings.l10n.global.behaviors.this_post_only + '</p>';
		}
		$.each(_upfront_post_data.layout, function (idx, el) {
			//var checked = el == current ? "checked='checked'" : '';
			//html += '<input type="radio" name="upfront_save_as" id="' + el + '" value="' + el + '" ' + checked + ' />';
			//html += '&nbsp;<label for="' + el + '">' + Upfront.Settings.LayoutEditor.Specificity[idx] + '</label><br />';
			if ( idx == 'type' ) return;
			if ( is_archive ) {
				html += '<span class="upfront-save-button" data-save-as="' + el + '">' + Upfront.Settings.LayoutEditor.ArchiveSpecificity[idx] + '</span>';
			}
			else {
				html += '<span class="upfront-save-button" data-save-as="' + el + '">' + Upfront.Settings.LayoutEditor.Specificity[idx] + '</span>';
			}
		});
		//html += '<button type="button" id="upfront-save_as">Save</button>';
		//html += '<button type="button" id="upfront-cancel_save">Cancel</button>';

		//$bg.remove(); $dialog.remove();
		//on_complete.apply(context, [_upfront_post_data.layout.specificity]);
		//return false;

		if(
				true === Upfront.plugins.isForbiddenByPlugin('show save as dialog') ||
				layout_changed !== true
		) {
			$bg.remove(); $dialog.remove();
			on_complete.apply(context, ['single-post']);
		} else {
			$dialog
				.html(html)
			;
			$("#upfront-save-dialog").on("click", ".upfront-save-button", function () {
				/*var $check = $dialog.find(":radio:checked"),
					selected = $check.length ? $check.val() : false
				;*/
				var selected = $(this).attr('data-save-as');
				$bg.remove(); $dialog.remove();
				on_complete.apply(context, [selected]);

				// call the listener on upfront-post-edit.js to continue saving post object
				Upfront.Events.trigger('command:proceed:save:post');

				return false;
			});
			$("#upfront-save-dialog-background").on("click", function () {
				$bg.remove(); $dialog.remove();
				return false;
			});
		}
	},

	/* Cleanup region CSS, running on save/export */
	clean_region_css: function () {
		var me = this,
			cssEditor = Upfront.Application.cssEditor,
            ed = Upfront.Behaviors.LayoutEditor,
			elementTypes = [cssEditor.elementTypes.RegionContainer, cssEditor.elementTypes.Region],
			layout = _upfront_post_data.layout,
			layout_id = layout.specificity || layout.item || layout.type,
			regions = Upfront.Application.layout.get('regions'),
			styleExists = [],
			deleteDatas = [],
			deleteFunc = function (index) {
				if ( ! deleteDatas[index] ) {
					Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.behaviors.region_css_cleaned);
					deferred.resolve();
					return;
				}
				var elementType = deleteDatas[index].elementType,
					styleName = deleteDatas[index].styleName,
					data;

				var pluginsCallResult = Upfront.plugins.call('prepare-delete-element-styles-data', {
					styleName: styleName,
					elementType: elementType
				});
				if (pluginsCallResult.status && pluginsCallResult.status === 'called' && pluginsCallResult.result) {
					data = pluginsCallResult.result;
				} else {
					data = {
						action: 'upfront_delete_styles',
						styleName: styleName,
						elementType: elementType
					};
				}
				Upfront.Util.post(data)
					.done(function(){
						var styleIndex = Upfront.data.styles[elementType].indexOf(styleName);

						//Remove the styles from the available styles
						if(styleIndex != -1)
							Upfront.data.styles[elementType].splice(styleIndex, 1);

						//Remove the styles from the dom
						$('#upfront-style-' + styleName).remove();

						//Continue deleting
						deleteFunc(index+1);
					})
				;
			},
			deferred = new $.Deferred()
		;

		regions.each(function(region){
			var elementType = region.is_main() ? cssEditor.elementTypes.RegionContainer.id : cssEditor.elementTypes.Region.id,
				styleName = layout_id + '-' + region.get('name') + '-style',
				isGlobal = ( region.get('scope') == 'global' );
			if ( _.isArray(Upfront.data.styles[elementType]) && Upfront.data.styles[elementType].indexOf(styleName) != -1 )
				styleExists.push(styleName);
			// global stylename
			styleName = elementType + '-' + region.get('name') + '-style';
			if ( _.isArray(Upfront.data.styles[elementType]) && Upfront.data.styles[elementType].indexOf(styleName) != -1 )
				styleExists.push(styleName);
		});

		Upfront.plugins.call('clean-region-css', {
			elementTypes: elementTypes,
			layout_id: layout_id,
			styleExists: styleExists,
			deleteDatas: deleteDatas,
			deleteFunc: deleteFunc
		});

		return deferred.promise();
	},

	_build_query: function (data) {
		return _.map(data, function(value, key){ return key + '=' + value; }).join('&');
	},

	clean_global_regions: function () {
		Upfront.data.global_regions = false;
	},

	open_global_region_manager: function () {
		var ed = Upfront.Behaviors.LayoutEditor;
		Upfront.Popup.open(
			function (data, $top, $bottom) {
				var $me = $(this);
				$me.html('<p class="upfront-popup-placeholder">' + Upfront.Settings.l10n.global.behaviors.loading_content + '</p>');

				if ( !Upfront.data.global_regions ){
					ed._refresh_global_regions().done(function(){
						ed._render_global_region_manager($me);
					});
				}
				else {
					ed._render_global_region_manager($me);
				}
			},
			{
				width: 600
			},
			'global-region-manager'
		);
	},
	
	open_theme_fonts_manager: function() {
		var me = {};
		var textFontsManager = new Upfront.Views.Editor.Fonts.Text_Fonts_Manager({ collection: Upfront.Views.Editor.Fonts.theme_fonts_collection });
		textFontsManager.render();
		// Only enable font icon manager on builder for now
		if (Upfront.Application.mode.current === Upfront.Application.MODE.THEME) {
			var iconFontsManager = new Upfront.Views.Editor.Fonts.Icon_Fonts_Manager({collection: Upfront.Views.Editor.Fonts.icon_fonts_collection});
			iconFontsManager.render();
		}

		var popup = Upfront.Popup.open(
			function (data, $top, $bottom) {
				var $me = $(this);
				$me.empty()
					.append('<p class="upfront-popup-placeholder">' + Upfront.Settings.l10n.global.behaviors.loading_content + '</p>');

				me.$popup = {
					"top": $top,
					"content": $me,
					"bottom": $bottom
				};
			},
			{
				width: 750
			},
			'font-manager-popup'
		);

		me.$popup.top.html(
			'<ul class="upfront-tabs">' +
				'<li id="theme-text-fonts-tab" class="active">' + Upfront.Settings.l10n.global.behaviors.theme_text_fonts + '</li>' +
				(Upfront.Application.mode.current === Upfront.Application.MODE.THEME ? '<li id="theme-icon-fonts-tab">' + Upfront.Settings.l10n.global.behaviors.theme_icon_fonts + '</li>' : '') +
			'</ul>' +
			me.$popup.top.html()
		);

		me.$popup.top.on('click', '#theme-text-fonts-tab', function(event) {
			me.$popup.content.html(textFontsManager.el);
			$('#theme-icon-fonts-tab').removeClass('active');
			$('#theme-text-fonts-tab').addClass('active');
			$('.theme-fonts-ok-button').css('margin-top', '30px');
		});

		me.$popup.top.on('click', '#theme-icon-fonts-tab', function() {
			me.$popup.content.html(iconFontsManager.el);
			$('#theme-text-fonts-tab').removeClass('active');
			$('#theme-icon-fonts-tab').addClass('active');
			$('.theme-fonts-ok-button').css('margin-top', 0);
		});

		me.$popup.bottom.append('<a class="theme-fonts-ok-button">' + Upfront.Settings.l10n.global.behaviors.ok + '</a>');
		me.$popup.content.html(textFontsManager.el);
		textFontsManager.set_ok_button(me.$popup.bottom.find('.theme-fonts-ok-button'));
		me.$popup.bottom.find('.theme-fonts-ok-button').on('click', function() {
			Upfront.Popup.close();
		});
	},

	_refresh_global_regions: function () {
		return Upfront.Util.post({
			action: 'upfront_list_scoped_regions',
			scope: 'global',
			storage_key: _upfront_save_storage_key
		}).done(function(data) {
			Upfront.data.global_regions = data.data;
		});
	},

	_render_global_region_manager: function ($el) {
		var ed = Upfront.Behaviors.LayoutEditor,
			collection = Upfront.Application.layout.get("regions"),
			region_managers = [
				{
					title: Upfront.Settings.l10n.global.behaviors.global_regions,
					classname: 'global',
					data: _.sortBy(Upfront.data.global_regions, function(region, i, regions){
						if ( !region.container || region.name == region.container )
							return i * 3;
						else
							return _.indexOf(regions, _.findWhere(regions, {name: region.container})) * 3 + 1;
					})
				},
				{
					title: Upfront.Settings.l10n.global.behaviors.lightboxes,
					classname: 'lightbox',
					data: Upfront.Util.model_to_json( collection.filter(function(model){
						return model.get('sub') == 'lightbox';
					}) )
				}
			];
		$el.html('');
		_.each(region_managers, function(manager){
			var $wrap = $('<div class="global-region-manager-wrap global-region-manager-' + manager.classname + '"></div>'),
				$title = $('<h3 class="global-region-manager-title">'+ manager.title +'</h3>'),
				$content = $('<div class="global-region-manager-content upfront-scroll-panel"></div>');
			$wrap.append([$title, $content]);
			ed._render_regions(manager.data, $content);
			$el.append($wrap);
			// don't propagate scroll
			Upfront.Views.Mixins.Upfront_Scroll_Mixin.stop_scroll_propagation($content);
		});
		$el.on('click', '.region-list-edit', function(e){
			e.preventDefault();
		});
		$el.on('click', '.region-list-trash', function(e){
			e.preventDefault();
			var name = $(this).attr('data-name');
			if ( $(this).closest('.global-region-manager-wrap').hasClass('global-region-manager-global') ){
				if ( confirm('Deleting the global regions will remove it from all layouts. Continue?') ) {
					Upfront.Util.post({
						action: 'upfront_delete_scoped_regions',
						scope: 'global',
						name: name,
						storage_key: _upfront_save_storage_key
					}).done(function(data) {
						// Also remove from current layout
						if ( data.data ) {
							_.each(data.data, function(region_name){
								var model = collection.get_by_name(region_name);
								collection.remove(model);
							});
							ed._refresh_global_regions().done(function(){
								ed._render_global_region_manager($el);
							});
						}
					});
				}
			}
			else {
				// lightbox
			}
		});
	},

	_render_regions: function (regions, $el) {
		var $lists = $('<ul class="global-region-manager-lists"></ul>');
		_.each(regions, function(region){
			var classes = ['global-region-manager-list'],
				has_main = false;
			if ( !region.container || region.name == region.container ){
				classes.push('region-list-main');
			}
			else {
				has_main = _.find(regions, function(reg){ return reg.name == region.container; });
				classes.push('region-list-sub');
				classes.push('region-list-sub-' + region.sub);
				if ( has_main )
					classes.push('region-list-sub-has-main');
			}
			$lists.append(
				'<li class="' + classes.join(' ') + '">' +
					'<span class="region-list-name">' + region.title + '</span>' +
					'<span class="region-list-control">' +
						//'<a href="#" class="region-list-edit" data-name="' + region.name + '">' + Upfront.Settings.l10n.global.behaviors.edit + '</a>' +
						(
							false === Upfront.plugins.isForbiddenByPlugin('show region list trash') ?
							'<a href="#" class="region-list-trash" data-name="' + region.name + '">' + Upfront.Settings.l10n.global.behaviors.trash + '</a>' :
							''
						) +
					'</span>' +
				'</li>'
			);
		});
		$el.append($lists);
	}
};

define(LayoutEditor);

})(jQuery);
//# sourceURL=layout-editor.js
