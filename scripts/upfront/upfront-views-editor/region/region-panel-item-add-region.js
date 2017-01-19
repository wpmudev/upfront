(function ($) {

		var l10n = Upfront.Settings && Upfront.Settings.l10n
						? Upfront.Settings.l10n.global.views
						: Upfront.mainData.l10n.global.views
				;

		define([
				"scripts/upfront/upfront-views-editor/region/region-panel-item",
				'scripts/upfront/upfront-views-editor/fields',
				'scripts/upfront/upfront-views-editor/modal',
				"text!upfront/templates/region_add_panel.html"
		], function ( RegionPanelItem, Fields, Modal, region_add_panel_tpl ) {
				return RegionPanelItem.extend({
						width: 24,
						height: 24,
						events: {
								'click': 'add_region_modal'
						},
						className: 'upfront-inline-panel-item upfront-region-panel-item-add-region',
						icon: function () {
								var to = this.options.to;
								if (to.match(/^(top|bottom)-(left|right)$/))
										return;
								return 'add ' + 'add-' + to;
						},
						tooltip: function () {
								var to = this.options.to,
					msg
				;
								switch (to) {
										case 'bottom':
												msg = l10n.new_region_below;
												break;
										case 'left':
												msg = l10n.new_sidebar_region;
												break;
										case 'right':
												msg = l10n.new_sidebar_region;
												break;
										case 'top':
												msg = l10n.new_region_above;
												break;
										case 'top-left':
										case 'top-right':
										case 'bottom-left':
										case 'bottom-right':
												msg = l10n.add_floating_region;
												break;
								}
								return msg;
						},
						tooltip_pos: function () {
								var to = this.options.to,
					pos
				;
								switch (to) {
										case 'bottom':
												pos = 'top';
												break;
										case 'left':
										case 'top-left':
										case 'bottom-left':
												pos = 'right';
												break;
										case 'right':
										case 'top-right':
										case 'bottom-right':
												pos = 'left';
												break;
										case 'top':
												pos = 'bottom';
												break;
								}
								return pos;
						},
						initialize: function (opts) {
								this.options = opts;
								if (!this.options.to)
										this.options.to = 'top';
								if (this.options.width)
										this.width = this.options.width;
								if (this.options.height)
										this.height = this.options.height;
						},
						add_region_modal: function (e) {
								var to = this.options.to,
										me = this,
										modal = new Modal({
											to: this.panel_view.panels_view.$el,
											width: 500,
											button: true,
											button_text: l10n.add_region
										}),
										disable_global = ( ( to == 'left' || to == 'right' ) && me.model.get('scope') == 'global' );
								var parentContainer = me.$el.parents('.upfront-region-center');
								parentContainer.addClass('upfront-region-editing-modal');
								parentContainer.next().find('.upfront-icon-control-region-resize').hide();
								fields = {
										from: new Fields.Radios({
												name: 'from',
												default_value: 'new',
												layout: 'horizontal-inline',
												values: [
														{label: l10n.new_region, value: 'new'},
														{label: l10n.choose_global_region, value: 'global', disabled: disable_global}
												],
												change: function () {
														var value = this.get_value();
														me.from = value;
												}
										}),
										region_title: new Fields.Text({
												name: 'name',
												placeholder: l10n.region_name_placeholder,
												focus: function () {
														fields.from.set_value('new');
														fields.from.trigger('changed');
												},
												change: function () {
														var value = this.get_value();
														me.region_title = value;
												}
										}),
										make_global: new Fields.Checkboxes({
												name: 'make_global',
												multiple: false,
												values: [{label: l10n.make_this_region_global, value: 1}],
												focus: function () {
														fields.from.set_value('new');
														fields.from.trigger('changed');
												},
												change: function () {
														var value = this.get_value();
														me.make_global = value == 1 ? true : false;
												}
										}),
										from_region: new Fields.Select({
												name: 'from_region',
												values: [{label: Upfront.Settings.l10n.global.behaviors.loading, value: ""}],
												disabled: disable_global,
												focus: function () {
														fields.from.set_value('global');
														fields.from.trigger('changed');
												},
												change: function () {
														var value = this.get_value();
														me.from_region = value;
												}
										})
								},
										from_region_values = function () {
												var values = [],
														is_main = ( to == 'top' || to == 'bottom' ),
														is_side = ( to == 'left' || to == 'right' );
												values.push({label: l10n.select_global_region, value: '', disabled: true});
												_.each(Upfront.data.global_regions, function (region) {
														if (is_main && region.container && region.name != region.container) // exclude sub-region if main
																return;
														if (is_side && ( region.sub != 'left' && region.sub != 'right' )) // exclude non-side region if it's side region (left/right)
																return;
														var collection = me.model.collection,
																region_exists = collection.get_by_name(region.name);
														values.push({
																label: region.title,
																value: region.name,
																disabled: ( region_exists !== false )
														});
												});
												return values;
										};
								modal.render();
								this.panel_view.panels_view.$el.append(modal.$el);

								// Set default
								this.from = 'new';
								this.region_title = '';
								this.make_global = false;
								this.from_region = '';

								if (!Upfront.data.global_regions) {
										Upfront.Util.post({
												action: 'upfront_list_scoped_regions',
												scope: 'global',
												storage_key: _upfront_save_storage_key
										}).done(function (data) {
												Upfront.data.global_regions = data.data;
												fields.from_region.options.values = from_region_values();
												fields.from_region.render();
												fields.from_region.delegateEvents();
										});
								}
								else {
										fields.from_region.options.values = from_region_values();
								}

								modal.open(function ($content, $modal) {
												var template = _.template(region_add_panel_tpl, {});
												_.each(fields, function (field, id) {
														field.render();
														field.delegateEvents();
												});
												$modal.addClass('upfront-add-region-modal');
												$content.append(template);
												$content.find('.upfront-add-region-choice').append(fields.from.$el);
												$content.find('.upfront-add-region-new').append(fields.region_title.$el);
												if (!disable_global)
														$content.find('.upfront-add-region-new').append(fields.make_global.$el);
												$content.find('.upfront-add-region-global').append(fields.from_region.$el);
												this.hide_or_show_resize_controls(true);
										}, this)
										.done(function (modal_view) {
												if (me.from == 'new' || !me.from_region) {
														me.add_region();
												}
												else {
														me.add_region_from_global(me.from_region);
												}
										})
										.always(function (modal_view) {
												me.hide_or_show_resize_controls(false);
												parentContainer.removeClass('upfront-region-editing-modal');
												parentContainer.next().find('.upfront-icon-control-region-resize').show();
												modal_view.remove();
										});

								e.stopPropagation();
						},
						hide_or_show_resize_controls: function(hide) {
							if (hide) {
								// Hide resize controls when add Region modal is open.
								return this.$el.parents('.upfront-region-container-active').addClass('upfront-add-region-container-active');
							}
							// Show resize controls when add Region modal is closed.
							return this.$el.parents('.upfront-region-container-active').removeClass('upfront-add-region-container-active');
						},
						add_region: function () {
								var to = this.options.to,
										collection = this.model.collection,
										total = collection.size() - 1, // total minus shadow region
										index = collection.indexOf(this.model),
										position = this.model.get('position'),
										sub_model = this.model.get_sub_regions(),
										is_new_container = ( to == 'top' || to == 'bottom' ),
										is_before = ( to == 'top' || to == 'left' ),
										region_title = this.region_title ? this.region_title.replace(/[^A-Za-z0-9\s_-]/g, '') : ( is_new_container ? "Region " : this.model.get('title') + ' ' + to.charAt(0).toUpperCase() + to.slice(1) ),
										region_name = region_title.toLowerCase().replace(/\s/g, '-'),
										new_title = collection.get_by_name(region_name) || (!this.region_title && is_new_container) ? collection.get_new_title(region_title, 1) : false,
										title = new_title !== false ? new_title.title : region_title,
										name = new_title !== false ? new_title.name : region_name,
										new_region = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
												"name": name,
												"container": is_new_container ? name : this.model.get('name'),
												"title": title
										})),
										options = {},
										sub_index_func = function (model) {
												if (!model || !model.cid)
														return -1;
												return collection.indexOf(model);
										};

								if (!is_new_container) {
										new_region.set_property('col', 5);
										if (to == 'left' || to == 'right') {
												new_region.set('sub', is_before ? 'left' : 'right');
												new_region.set('position', is_before ? position - 1 : position + 1);
												options.sub = is_before ? 'left' : 'right';
										}
										else if (to == 'top-left' || to == 'top-right' || to == 'bottom-left' || to == 'bottom-right') {
												new_region.set('type', 'fixed');
												new_region.set('sub', 'fixed');
												new_region.set_property('width', 225);
												new_region.set_property('height', 225);
												if (to.match(/^top/))
														new_region.set_property('top', 30);
												if (to.match(/^bottom/))
														new_region.set_property('bottom', 30);
												if (to.match(/left$/))
														new_region.set_property('left', 30);
												if (to.match(/right$/))
														new_region.set_property('right', 30);
												new_region.set_property('background_type', 'color');
												new_region.set_property('background_color', '#aeb8c2');
												options.sub = 'fixed';
										}
										if (this.make_global)
												new_region.set({scope: 'global'});
										else
												new_region.set({scope: this.model.get('scope')});
								}
								else {
										new_region.set_property('row', Upfront.Util.height_to_row(300)); // default to 300px worth of rows
										var sub_model_index = _.filter(_.map(sub_model, sub_index_func), function (i) {
														return i >= 0;
												}),
												sub_model_fixed_index = sub_model.fixed.length > 0 ? _.map(sub_model.fixed, sub_index_func) : [];
										sub_model_index = _.union(sub_model_index, sub_model_fixed_index, [index]);
										if (sub_model_index.length > 0) {
												if (to == 'top')
														index = _.min(sub_model_index);
												else if (to == 'bottom')
														index = _.max(sub_model_index);
										}
										if (this.make_global)
												new_region.set({scope: 'global'});
								}
								if (new_region.get('clip') || !is_new_container) {
										Upfront.Events.once('entity:region:before_render', this.before_animation, this);
										Upfront.Events.once('entity:region:added', this.run_animation, this);
								}
								else {
										Upfront.Events.once('entity:region_container:before_render', this.before_animation, this);
										Upfront.Events.once('entity:region:added', this.run_animation, this);
								}
								new_region.add_to(collection, (is_before ? index : index + 1), options);

								var wide_regions = collection.where({type: 'wide'});
								if (wide_regions.length > 0) {
										$('div.upfront-regions a#no_region_add_one').remove();

								}
						},
						add_region_from_global: function (from_region) {
								var me = this,
										to = this.options.to,
										collection = this.model.collection,
										total = collection.size() - 1, // total minus shadow region
										index = collection.indexOf(this.model),
										position = this.model.get('position'),
										sub_model = this.model.get_sub_regions(),
										is_new_container = ( to == 'top' || to == 'bottom' ),
										is_before = ( to == 'top' || to == 'left' ),
										sub_index_func = function (model) {
												if (!model || !model.cid)
														return -1;
												return collection.indexOf(model);
										};
								if (is_new_container) {
										var sub_model_index = _.filter(_.map(sub_model, sub_index_func), function (i) {
														return i >= 0;
												}),
												sub_model_fixed_index = sub_model.fixed.length > 0 ? _.map(sub_model.fixed, sub_index_func) : [];
										sub_model_index = _.union(sub_model_index, sub_model_fixed_index, [index]);
										if (sub_model_index.length > 0) {
												if (to == 'top')
														index = _.min(sub_model_index);
												else if (to == 'bottom')
														index = _.max(sub_model_index);
										}
								}
								if (!is_new_container) {
										Upfront.Events.once('entity:region:before_render', this.before_animation, this);
										Upfront.Events.once('entity:region:added', this.run_animation, this);
								}
								else {
										Upfront.Events.once('entity:region_container:before_render', this.before_animation, this);
										Upfront.Events.once('entity:region:added', this.run_animation, this);
								}
								Upfront.Util.post({
										action: 'upfront_get_scoped_regions',
										scope: 'global',
										name: from_region,
										storage_key: _upfront_save_storage_key
								}).done(function (data) {
										var regions = data.data,
												main_add = false,
												to_add = [],
												to_add_run = function () {
														_.each(to_add, function (add) {
																add.model.add_to(collection, add.index, add.options);
														});
												};
										_.each(regions, function (region, i) {
												var region_model = new Upfront.Models.Region(region),
														options = {};
												if (!region_model.is_main()) {
														if (to == 'left' || to == 'right') {
																region_model.set('container', me.model.get('name'));
																region_model.set('sub', is_before ? 'left' : 'right');
																options.sub = is_before ? 'left' : 'right';
														}
														else {
																options.sub = region_model.get('sub');
														}
														to_add.push({
																model: region_model,
																index: (is_before ? index : index + 1) + i,
																options: options
														});
												}
												else {
														main_add = {
																model: region_model,
																index: (is_before ? index : index + 1),
																options: options
														};
												}
										});
										if (main_add !== false) {
												Upfront.Events.once('entity:region:added', function () {
														to_add_run();
												});
												main_add.model.add_to(collection, main_add.index, main_add.options);
										}
										else {
												to_add_run();
										}
								});
						},
						before_animation: function (view, model) {
								// prepare to run animation, disable edit
								Upfront.Events.trigger('command:region:edit_toggle', false);
								Upfront.Events.trigger('command:region:fixed_edit_toggle', false);
						},
						run_animation: function (view, model) {
								var to = this.options.to,
										ani_class = 'upfront-add-region-ani upfront-add-region-ani-' + to,
										end_t = setTimeout(end, 500),
										ani_event_start = 'animationstart.region_ani webkitAnimationStart.region_ani MSAnimationStart.region_ani oAnimationStart.region_ani',
										ani_event_end = 'animationend.region_ani webkitAnimationEnd.region_ani MSAnimationEnd.region_ani oAnimationEnd.region_ani'
										;
								view.$el.one(ani_event_start, function () {
										clearTimeout(end_t);
										view.$el.off(ani_event_start); // Make sure to remove any remaining unfired event
								});
								view.$el.one(ani_event_end, function () {
										end();
										view.$el.off(ani_event_end); // Make sure to remove any remaining unfired event
								});
								// add animation class to trigger css animation
								view.$el.addClass(ani_class);
								// scroll if needed
								if (to == 'top' || to == 'bottom') {
										var $container = view.$el.hasClass('upfront-region-container') ? view.$el : view.$el.closest('.upfront-region-container'),
												offset = $container.offset(),
												scroll_top = $(document).scrollTop(),
												scroll_to = false,
												height = $container.height(),
												w_height = $(window).height();
										if (to == 'top' && offset.top < scroll_top)
												scroll_to = offset.top - 50;
										else if (to == 'bottom' && offset.top + height > scroll_top + w_height)
												scroll_to = offset.top + height - w_height;
										if (scroll_to !== false)
												$('html,body').animate({scrollTop: scroll_to}, 600);
								}
								function end() {
										var baseline = Upfront.Settings.LayoutEditor.Grid.baseline,
											height = view.$el.outerHeight()
										;
										//model.set_property('row', Math.ceil(height/baseline), true);
										view.$el.removeClass(ani_class);
										// enable edit and activate the new region
										Upfront.Events.trigger('command:region:edit_toggle', true);
										Upfront.Events.trigger('command:region:fixed_edit_toggle', true);
										view.trigger("activate_region", view);
										// Trigger Settings for new region.
										view.trigger_edit();

								}
						}
				});

		});
})(jQuery);
