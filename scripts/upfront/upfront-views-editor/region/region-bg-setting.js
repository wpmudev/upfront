(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;
	define([
		'scripts/upfront/upfront-views-editor/modal-bg-setting',
		'scripts/upfront/upfront-views-editor/fields',
		"text!upfront/templates/region_edit_panel.html"
	], function (ModalBgSetting, Fields, region_edit_panel_tpl) {


		return ModalBgSetting.extend({
			events: {
				// Cancel button:
				"click .upfront-inline-modal-cancel": "on_click_cancel",
				"click .upfront-inline-modal-content": "on_click_content",
				"click .uf-settings-panel__title": "toggle_advanced_settings",
				"click .upfront-inline-modal-save": "on_click_save"
			},
			render_modal: function ($content, $modal) {
				var me = this,
					setting_cback = this.get_template(),
					setting = setting_cback()
				;

				// Preserve background settings element event binding by detaching them before resetting html
				$content.find('.upfront-region-bg-setting-tab-primary, .upfront-region-bg-setting-tab-secondary').children().detach();

				$content.html(setting);
				$modal.addClass('upfront-region-modal-bg');

				this.render_header_settings($content.find('.upfront-region-bg-setting-header'));

				this.render_main_settings($content);

				this.render_footer_settings($content.find('.upfront-region-bg-setting-footer'));

				this.render_bg_type_settings($content);

				// Render padding settings
				this.render_padding_settings($content.find('.upfront-region-bg-setting-padding'));

				// If region settings sidebar, fix z-index issues.
				if (this.$el.parent().attr('id') === 'region-settings-sidebar') {
					// adding class to #sidebar-ui for fixing z-index issues with main dropdown.
					$('#sidebar-ui').addClass('region-settings-activated');
				}
			},

			close: function(save) {
				// removing class from #sidebar-ui that was previously added on showSettings
				$('#sidebar-ui').removeClass('region-settings-activated');
				return ModalBgSetting.prototype.close.call(this, save);
			},

			get_template: function () {
				var $template = $(region_edit_panel_tpl);
				return _.template($template.find('#upfront-region-bg-setting').html());
			},

			get_bg_types: function () {
				var breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					bg_type = this.model.get_property_value_by_name('background_type'),
					types = [
						{ label: l10n.solid_color, value: 'color', icon: 'color' },
						{ label: l10n.image, value: 'image', icon: 'image' },
						{ label: l10n.video, value: 'video', icon: 'video' },
						{ label: l10n.image_slider, value: 'slider', icon: 'slider' },
						{ label: l10n.map, value: 'map', icon: 'map' }
					]
				;

				if ( breakpoint && !breakpoint['default'] ) {
					types.unshift({ label: l10n.inherit, value: '', icon: ( bg_type ? bg_type : 'color' ) });
				}

				if (
					_upfront_post_data.post_id ||
					(
						true === Upfront.plugins.isRequiredByPlugin('show feature image region type') &&
						Upfront.Application.is_single()
					)
				) {
					if ( !Upfront.Application.is_single('404_page') ) {
						types.push({ label: l10n.featured_image, value: 'featured', icon: 'feat' });
					}
				}
				return types;
			},

			get_region_types: function (index_container) {
				var types = [
						{ label: l10n.full_width, value: 'wide' },
						{ label: l10n.contained, value: 'clip' }
					];
				return index_container > 0
					? types
					: _.union( [
						{ label: l10n.full_screen, value: 'full' }
					], types);
			},

			render_header_settings: function ($region_header) {
				var me = this,
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					is_responsive = ( breakpoint && !breakpoint['default'] ),
					sub = this.model.is_main() ? false : this.model.get('sub'),
					$template = $(region_edit_panel_tpl),
					name_tpl = _.template($template.find('#upfront-region-bg-setting-name').html()),
					region_name = new Fields.Text({
						model: this.model,
						name: 'title',
						placeholder: l10n.region_name_placeholder,
						compact: true,
						change: function () {
						},
						blur: function () {
							var collection = this.model.collection,
								prev_title = this.model.get('title'),
								prev_name = this.model.get('name'),
								title = $.trim(this.get_value().replace(/[^A-Za-z0-9\s_-]/g, '')), // strict filtering to prevent unwanted character
								name = title.toLowerCase().replace(/\s/g, '-'),
								new_title, sub_regions, region_css
							;
							if ( prev_title != title ) {
								// Check if the region name exists
								if ( collection.get_by_name(name) ) {
									new_title = collection.get_new_title(title + " ", 2);
									title = new_title.title;
									name = new_title.name;
								}

								// Let's keep old CSS content
								region_css = me.get_region_css_styles(this.model);

								// Also update the container attribute on sub regions
								if ( this.model.is_main() ) {
									sub_regions = this.model.get_sub_regions();
									_.each(sub_regions, function(sub_model, sub){
										if ( _.isArray(sub_model) ) {
											_.each(sub_model, function(sub_model2){ sub_model2.set({container: name}, {silent:true}); });
										}
										else if ( _.isObject(sub_model) ) {
											sub_model.set({container: name}, {silent:true});
										}
									});
									this.model.set({title: title, name: name, container: name}, {silent: true});
								}
								else {
									this.model.set({title: title, name: name}, {silent: true});
								}
								$region_name.find('.upfront-region-name-edit-value').text(title);

								// Save to the new CSS
								me.set_region_css_styles(this.model, region_css.styles, region_css.selector);

								this.model.get('properties').trigger('change');
							}
						},
						rendered: function () {
							var me = this;
							this.get_field().on('keyup', function(e){
								if ( e.which === 13 ) me.trigger('blur');
							});
						}
					}),
					make_global = new Fields.Button({
						model: this.model,
						name: 'scope',
						classname: 'upfront-region-bg-setting-globalize',
						label: l10n.make_global,
						compact: true,
						on_click: function(){
							me.apply_region_scope(this.model, 'global');
							$region_auto.show();
							// Show Global Label.
							$region_name.find('.upfront-region-bg-setting-is-global').show();
							// Show Localize button.
							localize_region.$el.show();
							// Hide this button.
							this.$el.hide();
						}
					}),
					localize_region = new Fields.Button({
						model: this.model,
						name: 'localize',
						label: l10n.localize_region,
						classname: 'upfront-region-bg-setting-localize',
						compact: true,
						on_click: function () {
							me.apply_region_scope(this.model, 'local');
							$region_auto.show();
							// Hide Global Label.
							$region_name.find('.upfront-region-bg-setting-is-global').hide();
							// Show Make Global button.
							make_global.$el.show();
							// Hide this button.
							this.$el.hide();
						},
						rendered: function () {
							this.$el.attr('title', l10n.localize_region_info);
						}
					}),
					name_save = new Fields.Button({
						model: this.model,
						name: 'save',
						label: l10n.ok.toLowerCase(),
						compact: true,
						classname: 'upfront-region-bg-setting-name-save',
						on_click: function () {
							//region_name.trigger('blur');
							$region_name.find('.upfront-region-bg-setting-name-wrap').show();
							$region_auto.show();
							$region_name.find('.upfront-region-bg-setting-name-edit').hide();
							// Make panels editable.
							me.toggle_editable_region_panels(true);
							if ( this.model.get('scope') == 'global' ) {
								make_global.$el.hide();
								if ( !localize_region._no_display )
									localize_region.$el.show();
							}
							else {
								make_global.$el.show();
							}
						}
					}),
					$region_name = $region_header.find('.upfront-region-bg-setting-name'),
					$region_auto = $region_header.parent().find('.upfront-region-bg-setting-auto-resize')
				;

				if ( is_responsive ) {
					// Don't show this on responsive
					$region_header.hide();
					return;
				}

				$region_name.append(name_tpl());

				region_name.render();
				make_global.render();
				localize_region.render();
				name_save.render();
				$region_name.find('.upfront-region-bg-setting-name-edit').append([region_name.$el, make_global.$el, localize_region.$el, name_save.$el]).hide();
				$region_name.find('.upfront-region-name-edit-value').text(this.model.get('title'));

				if ( this.model.get('scope') == 'global' ) {
					$region_name.find('.upfront-region-bg-setting-is-global').show();
					make_global.$el.hide();
					if ( !this.model.is_main() && sub ) {
						var main_region = this.model.collection.get_by_name(this.model.get('container'));
						if ( main_region && main_region.get('scope') == 'global' ){
							localize_region.$el.hide();
							localize_region._no_display = true;
						}
					}
				}
				else {
					$region_name.find('.upfront-region-bg-setting-is-global').hide();
					localize_region.$el.hide();
				}

				// Let's not allow name change for header/footer, as the name is reserved for global region
				//if ( this.model.get('name') == 'header' || this.model.get('name') == 'footer' ){
				//	$region_name.find('.upfront-region-name-edit-trigger').hide();
				//}
				//else {
				$region_name.on('click', '.upfront-region-name-edit-trigger', function(e){
					e.preventDefault();
					$region_name.find('.upfront-region-bg-setting-name-wrap').hide();
					$region_auto.hide();
					// Make panels un-editable.
					me.toggle_editable_region_panels(false);
					$region_name.find('.upfront-region-bg-setting-name-edit').show();
					if ( me.model.get('scope') != 'global' )
						region_name.get_field().prop('disabled', false).trigger('focus').select();
					else
						region_name.get_field().prop('disabled', true);
				});
				//}

				if ( this.model.is_main() ){
					$region_auto.on('click', function (e) {
						e.preventDefault();
						e.stopPropagation();
						me.trigger_expand_lock($(this));
					});
					this.render_expand_lock($region_auto);
				}
				else {
					$region_auto.hide();
				}
			},

			toggle_editable_region_panels: function(make_editable) {
				if (make_editable) {
					// Make content editable.
					return $('.upfront-bg-setting-type, .upfront-region-bg-setting-region-style-container, .upfront-region-bg-setting-footer, .upfront-bg-setting-tab, .upfront-region-bg-setting-padding').css({ pointerEvents: "auto", opacity: 1});
				} else {
					// Make content un-editable.
					return $('.upfront-bg-setting-type, .upfront-region-bg-setting-region-style-container, .upfront-region-bg-setting-footer, .upfront-bg-setting-tab, .upfront-region-bg-setting-padding').css({ pointerEvents: "none", opacity: 0.5});
				}
			},

			render_main_settings: function ($content) {
				var me = this,
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					is_responsive = ( breakpoint && !breakpoint['default'] ),
					collection = this.model.collection,
					index = collection.indexOf(this.model),
					index_container = collection.index_container(this.model, ['shadow', 'lightbox']),
					total_container = collection.total_container(['shadow', 'lightbox']), // don't include shadow and lightbox region
					is_top = index_container == 0,
					is_bottom = index_container == total_container-1,
					region_type = new Fields.Select({
						model: this.model,
						name: 'type',
						default_value: 'wide',
						label: l10n.region_style,
						layout: 'horizontal-inline',
						values: this.get_region_types(index_container),
						change: function () {
							var value = this.get_value();
							this.model.set({type: value}, {silent: true});
							if ( value == 'full' ){
								$region_nav.show();
								$region_behavior.show();
								this.model.set({sticky: 0}, {silent: true});
							}
							else {
								$region_nav.hide();
								$region_behavior.hide();
							}
							this.model.get('properties').trigger('change');
							me.update_pos();
							// Re-toggle editing
							Upfront.Events.trigger('command:region:edit_toggle', false);
							Upfront.Events.trigger('command:region:edit_toggle', true);
						}
					}),
					// backward compatible with old nav_region property
					region_nav_value = this.model.get_property_value_by_name('nav_region'),
					region_nav = new Fields.Checkboxes({
						model: this.model,
						property: 'sub_regions',
						default_value: !this.model.get_property_value_by_name('sub_regions') ? [region_nav_value] : [],
						layout: 'horizontal-inline',
						multiple: true,
						values: [
							{ label: l10n.top, value: 'top' },
							{ label: l10n.bottom, value: 'bottom' }
						],
						change: function () {
							var value = this.get_value(),
								sub_regions = me.model.get_sub_regions(),
								copy_data = false
							;
							index = collection.indexOf(me.model);

							if ( !_.contains(value, 'top') && sub_regions.top ) {
								copy_data = Upfront.Util.model_to_json(sub_regions.top);
								me._sub_region_top_copy = new Upfront.Models.Region(copy_data);
								collection.remove(sub_regions.top);
							}
							if ( !_.contains(value, 'bottom') && sub_regions.bottom ) {
								copy_data = Upfront.Util.model_to_json(sub_regions.bottom);
								me._sub_region_bottom_copy = new Upfront.Models.Region(copy_data);
								collection.remove(sub_regions.bottom);
							}

							_.each(value, function(sub){
								if ( sub_regions[sub] ) return;
								var add_region = false,
									region_model = false
									;
								if ( sub == 'bottom' ) {
									if ( me._sub_region_bottom_copy ) region_model = me._sub_region_bottom_copy;
									add_region = sub_regions.right ? index+2 : index+1;
								}
								else if ( sub == 'top' ) {
									if ( me._sub_region_top_copy ) region_model = me._sub_region_top_copy;
									add_region = sub_regions.left ? index-1 : index;
								}
								if ( add_region !== false ) {
									var name = me.model.get('name') + '_' + sub,
										title = me.model.get('title') + ' ' + sub
										;
									if ( region_model === false ){
										region_model = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
											"name": name,
											"title": title,
											"container": me.model.get('name'),
											"sub": sub,
											"scope": me.model.get('scope')
										}));
									}
									region_model.add_to(collection, add_region, {sub: sub});
									Upfront.Events.trigger('command:region:edit_toggle', true);
								}
							});
							this.property.set({value: value});
						}
					}),
					region_behavior = new Fields.Radios({
						model: this.model,
						name: 'behavior',
						default_value: 'keep-position',
						layout: 'horizontal-inline',
						values: [
							{ label: l10n.keep_position, value: 'keep-position' },
							{ label: l10n.keep_ratio, value: 'keep-ratio' }
						],
						change: function () {
							var value = this.get_value();
							this.model.set({behavior: value}, {silent: true});
							this.model.get('properties').trigger('change');
						}
					}),
					$region_type = $content.find('.upfront-region-bg-setting-region-type'),
					$region_nav = $content.find('.upfront-region-bg-setting-region-nav'),
					$region_behavior = $content.find('.upfront-region-bg-setting-region-behavior')
				;

				if ( !is_responsive && this.model.is_main() ) {
					region_type.render();
					$region_type.append(region_type.$el);
					region_nav.render();
					$region_nav.append(region_nav.$el);
					region_behavior.render();
					$region_behavior.append(region_behavior.$el);
				}
				else {
					$region_type.hide();
					$region_nav.hide();
					$region_behavior.hide();
				}

				if ( this.model.is_main() ) {
					this.listenTo(region_type, 'changed', function(){
						me.render_expand_lock($content.find('.upfront-region-bg-setting-auto-resize'));
					});
					if ( !is_responsive ) region_type.trigger('changed');
				}
			},

			render_footer_settings: function ($region_footer) {
				var me = this,
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					is_responsive = ( breakpoint && !breakpoint['default'] ),
					sub = this.model.is_main() ? false : this.model.get('sub'),
					$region_sticky = $region_footer.find('.upfront-region-bg-setting-sticky')
				;

				if ( !is_responsive && ( this.model.is_main() || sub == 'top' || sub == 'bottom' ) ) {
					this.render_sticky_settings($region_sticky);
				}
				else {
					$region_sticky.hide();
				}

				$region_footer.find('.upfront-region-bg-setting-edit-css').on('click', function(e){
					e.preventDefault();
					e.stopPropagation();
					me.trigger_edit_css();
				});
			},

			render_sticky_settings: function ($region_sticky) {
				var collection = this.model.collection,
					has_sticky = collection.findWhere({sticky: '1'}),
					region_sticky = new Fields.Checkboxes({
						model: this.model,
						name: 'sticky',
						default_value: '',
						layout: 'horizontal-inline',
						values: [
							{ label: l10n.sticky_region + ':', value: '1' }
						],
						change: function () {
							var value = this.get_value();
							this.model.set({sticky: value}, {silent: true});
							this.model.get('properties').trigger('change');
						},
						multiple: false
					})
				;

				// Show the sticky option if there's no sticky region yet AND the region is <= 300px height
				if ( ( !has_sticky && this.for_view.$el.height() <= 300 ) || this.model.get('sticky') ) {
					region_sticky.render();
					region_sticky.$el.find('label').append('<span class="upfront-bg-setting-sticky-toggle"></span>');
					$region_sticky.append(region_sticky.$el);
				}
				else {
					$region_sticky.hide();
				}
			},

			render_padding_settings: function ($content) {
				var $template = $(region_edit_panel_tpl),
					tpl = _.template($template.find('#upfront-region-bg-setting-padding').html()),
					bg_padding_type = new Fields.Checkboxes({
						model: this.model,
						use_breakpoint_property: true,
						property: 'bg_padding_type',
						label: '',
						values: [{ label: ' ', value: 'varied' }, { label: l10n.equal_padding, value: 'equal' }],
						multiple: false,
						default_value: this.model.get_breakpoint_property_value('bg_padding_type') || 'equal',
						change: function () {
							this.model.set_breakpoint_property('bg_padding_type', this.get_value());
						},
						show: function (value, $el) {
							if(value === 'varied') {
								$('.upfront-region-bg-setting-padding-top', $content).show();
								$('.upfront-region-bg-setting-padding-bottom', $content).show();
								$('.upfront-region-bg-setting-equal-padding', $content).hide();
							}
							else {
								$('.upfront-region-bg-setting-equal-padding', $content).show();
								$('.upfront-region-bg-setting-padding-top', $content).hide();
								$('.upfront-region-bg-setting-padding-bottom', $content).hide();
							}
						}
					}),
					top_bg_padding_num = new Fields.Number({
						model: this.model,
						use_breakpoint_property: true,
						property: 'top_bg_padding_num',
						label: '',
						default_value: this.model.get_breakpoint_property_value('top_bg_padding_num') || 0,
						prefix: l10n.bottom_padding,
						suffix: l10n.px,
						min: 0,
						step: 5,
						change: function () {
							var value = this.get_value();

							this.model.set_breakpoint_property('top_bg_padding_num', value);
						}
					}),
					bottom_bg_padding_num = new Fields.Number({
						model: this.model,
						use_breakpoint_property: true,
						property: 'bottom_bg_padding_num',
						label: '',
						default_value: this.model.get_breakpoint_property_value('bottom_bg_padding_num') || 0,
						suffix: l10n.px,
						min: 0,
						step: 5,
						change: function () {
							var value = this.get_value();

							this.model.set_breakpoint_property('bottom_bg_padding_num', value);
						}
					}),
					bg_padding_num = new Fields.Number({
						model: this.model,
						use_breakpoint_property: true,
						property: 'bg_padding_num',
						label: '',
						default_value: this.model.get_breakpoint_property_value('bg_padding_num') || 0,
						suffix: l10n.px,
						min: 0,
						step: 5,
						change: function () {
							var value = this.get_value();

							this.model.set_breakpoint_property('bg_padding_num', value);
							top_bg_padding_num.get_field().val(value);
							bottom_bg_padding_num.get_field().val(value);
							this.model.set_breakpoint_property('top_bg_padding_num', value, true);
							this.model.set_breakpoint_property('bottom_bg_padding_num', value, true);
						}
					}),
					$region_padding_type,
					$region_equal_padding,
					$region_top_padding,
					$region_bottom_padding
				;
				$content.append(tpl());

				$region_padding_type = $content.find('.upfront-region-bg-setting-padding-type');
				$region_equal_padding = $content.find('.upfront-region-bg-setting-equal-padding');
				$region_top_padding = $content.find('.upfront-region-bg-setting-padding-top');
				$region_bottom_padding = $content.find('.upfront-region-bg-setting-padding-bottom');

				// Hide first
				if ( 'varied' === this.model.get_breakpoint_property_value('bg_padding_type') ) {
					$region_equal_padding.hide();
				}
				else {
					$region_top_padding.hide();
					$region_bottom_padding.hide();
				}

				bg_padding_type.render();
				$region_padding_type.append(bg_padding_type.$el);
				top_bg_padding_num.render();
				$region_top_padding.append(top_bg_padding_num.$el);
				bottom_bg_padding_num.render();
				$region_bottom_padding.append(bottom_bg_padding_num.$el);
				bg_padding_num.render();
				$region_equal_padding.append(bg_padding_num.$el);
			},

			apply_region_scope: function (model, scope, name, title) {
				var me = this,
					sub_regions = model.get_sub_regions(),
					prev_title = model.get('title'),
					prev_name = model.get('name'),
					set_sub = function (region) {
						var css = me.get_region_css_styles(region);
						region.set({scope: scope}, {silent: true});
						if ( name && prev_name != name ){
							var title_rx = new RegExp('^' + prev_title, 'i'),
								name_rx = new RegExp('^' + prev_name, 'i'),
								sub_title = region.get('title').replace( title_rx, title ),
								sub_name = region.get('name').replace( name_rx, name );
							region.set({
								container: name,
								title: sub_title,
								name: sub_name
							}, {silent: true});
						}
						me.set_region_css_styles(region, css.styles, css.selector);
						region.get('properties').trigger('change');
					},
					region_css;
				if ( model.is_main() ){
					_.each(sub_regions, function(sub){
						if ( _.isArray(sub) )
							_.each(sub, function(each){ set_sub(each); });
						else if ( sub )
							set_sub(sub);
					});
				}
				region_css = me.get_region_css_styles(model);
				model.set({ scope: scope }, {silent: true});
				if ( name && prev_name != name ){
					model.set({
						title: title,
						name: name,
						container: name
					}, {silent: true});
				}
				me.set_region_css_styles(model, region_css.styles, region_css.selector);
				model.get('properties').trigger('change');
			},

			get_region_css_styles: function (model) {
				Upfront.Application.cssEditor.init({
					model: model,
					type: model.is_main() ? "RegionContainer" : "Region",
					element_id: model.is_main() ? "region-container-" + model.get('name') : "region-" + model.get('name'),
					no_render: true
				});
				return {
					styles: $.trim(Upfront.Application.cssEditor.get_style_element().html()),
					selector: Upfront.Application.cssEditor.get_css_selector()
				};
			},

			set_region_css_styles: function (model, styles, prev_selector) {
				if ( styles ) {
					Upfront.Application.cssEditor.init({
						model: model,
						type: model.is_main() ? "RegionContainer" : "Region",
						element_id: model.is_main() ? "region-container-" + model.get('name') : "region-" + model.get('name'),
						no_stylename_fallback: true,
						no_render: true
					});
					selector = Upfront.Application.cssEditor.get_css_selector();
					if ( prev_selector != selector )
						styles = styles.replace(new RegExp(prev_selector.replace(/^\./, '\.'), 'g'), selector);
					Upfront.Application.cssEditor.get_style_element().html(styles);
					Upfront.Application.cssEditor.saveCall(false);
				}
			},

			// Expand lock trigger
			render_expand_lock: function ($el) {
				var locked = this.model.get_breakpoint_property_value('expand_lock', true),
					type = this.model.get('type'),
					$status = $('<span />')
				;
				if ( type == 'full' ) {
					$el.addClass('upfront-region-bg-setting-auto-resize-disabled');
					$el.attr('title', l10n.auto_resize_disabled_title);
				}
				else {
					$el.removeClass('upfront-region-bg-setting-auto-resize-disabled');
					$el.removeAttr('title');
				}
				if ( locked ){
					$status.addClass('auto-resize-off');
				}
				else {
					$status.addClass('auto-resize-on');
				}
				$el.html('');
				$el.append('<span>' + l10n.auto_resize + '</span>');
				$el.append($status);
			},

			trigger_expand_lock: function ($el) {
				if ( $el.hasClass('upfront-region-bg-setting-auto-resize-disabled') )
					return;
				var locked = this.model.get_breakpoint_property_value('expand_lock');
				this.model.set_breakpoint_property('expand_lock', !locked);
				this.render_expand_lock($el);
			},

			// Edit CSS trigger
			trigger_edit_css: function () {
				Upfront.Application.cssEditor.init({
					model: this.model,
					type: this.model.is_main() ? "RegionContainer" : (this.model.get('type') == 'lightbox')?"RegionLightbox":"Region",
					element_id: this.model.is_main() ? "region-container-" + this.model.get('name') : "region-" + this.model.get('name')
				});

				this.listenTo(Upfront.Application.cssEditor, 'updateStyles', this.adjust_grid_padding);
			},
			toggle_advanced_settings: function() {
				if (this.$el.find('.advanced-settings').hasClass('uf-settings-panel--expanded')) {
					this.$el.find('.advanced-settings').removeClass('uf-settings-panel--expanded')
						.find('.uf-settings-panel__body').hide();
				} else {
					this.$el.find('.advanced-settings').addClass('uf-settings-panel--expanded')
						.find('.uf-settings-panel__body').show();
				}
			},
			
			// Close Region Settings Sidebar.
			on_click_cancel: function() {
				this.close(false);
			},

			adjust_grid_padding: function() {
				var togglegrid = new Upfront.Views.Editor.Command_ToggleGrid();
				togglegrid.update_grid();
			}
		});

	});
}(jQuery));
