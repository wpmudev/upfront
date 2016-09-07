(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;
	define([
		'scripts/upfront/upfront-views-editor/modal',
		'scripts/upfront/upfront-views-editor/fields',
		"text!upfront/templates/bg_setting.html"
	], function (Modal, Fields, bg_setting_tpl) {


		return Modal.extend({
			open: function () {
				return Modal.prototype.open.call(this, this.render_modal, this, true);
			},

			render_modal: function ($content, $modal) {
				var me = this,
					grid = Upfront.Settings.LayoutEditor.Grid,
					$template = $(bg_setting_tpl),
					setting_cback = _.template($template.find('#upfront-bg-setting').html()),
					setting = setting_cback(),
					contained_region = new Fields.Number({
						model: this.model,
						property: 'contained_region_width',
						label: l10n.contained_region_width,
						label_style: "inline",
						default_value: grid.size*grid.column_width,
						min: grid.size*grid.column_width,
						max: 5120,
						step: 1,
						suffix: l10n.px,
						change: function () {
							var value = this.get_value();
							value = ( value < this.options.min ) ? this.options.min : value;
							this.property.set({value: value});
							Upfront.Events.trigger('upfront:layout:contained_region_width', value);
						}
					})
				;

				// Preserve background settings element event binding by detaching them before resetting html
				$content.find('.upfront-bg-setting-tab-primary, .upfront-bg-setting-tab-secondary').children().detach();

				$content.html(setting);
				$modal.addClass('upfront-modal-bg');

				contained_region.render();
				$content.find('.upfront-bg-setting-theme-body').append(contained_region.$el);

				this.render_bg_type_settings($content);
			},

			on_close_modal: function () {
				var me = this;
				me._active = false;
				me.render_icon();
			},

			notify: function () {
				Upfront.Views.Editor.notify(l10n.bg_updated);
			},

			render_bg_type_settings: function ($content) {
				var me = this,
					bg_image = this.model.get_breakpoint_property_value('background_image', true),
					bg_type = new Fields.Select({
						model: this.model,
						property: 'background_type',
						use_breakpoint_property: true,
						default_value: !bg_image ? 'color' : 'image',
						icon_class: 'upfront-region-field-icon',
						values: this.get_bg_types(),
						change: function () {
							var saved = this.get_saved_value(),
								value = this.get_value()
							;
							this.model.set_breakpoint_property(this.property_name, value);
							$content.find('.upfront-bg-setting-tab').not('.upfront-bg-setting-tab-'+value).hide();
							$content.find('.upfront-bg-setting-tab-'+value).show();
							me.render_modal_tab(value, $content.find('.upfront-bg-setting-tab-'+value), $content);
							if ( saved != value ) {
								me.prompt_responsive_change(this.property_name);
							}
						}
					})
				;

				bg_type.render();
				$content.find('.upfront-bg-setting-type').append(bg_type.$el);

				bg_type.trigger('changed');
			},

			get_bg_types: function () {
				return [
					{ label: l10n.solid_color, value: 'color', icon: 'color' },
					{ label: l10n.image, value: 'image', icon: 'image' },
					{ label: l10n.video, value: 'video', icon: 'video' }
				];
			},

			is_responsive_changed: function (property_name) {
				var me = this,
					breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled(),
					breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
					is_changed = false
				;
				if ( !breakpoint['default'] ) return false; // Only check on default breakpoint
				_.each(breakpoints, function(each) {
					if ( is_changed ) return; // Already found changes, no need to continue
					var each = each.toJSON(),
						property_value = me.model.get_breakpoint_property_value(property_name, false, false, each)
					;
					if ( each['default'] ) return;
					if ( false !== property_value ) {
						is_changed = true;
					}
				});
				return is_changed;
			},

			prompt_responsive_change: function (property_name) {
				if ( !this.is_responsive_changed(property_name) ) return;
				var me = this,
					is_region = ( this.model instanceof Upfront.Models.Region ),
					title = is_region ? this.model.get('title') : l10n.global_bg,
					prompt = new Upfront.Views.Editor.Modal({to: $('body'), button: false, top: 120, width: 450})
				;
				prompt.render();
				$('body').append(prompt.el);

				prompt.open(function($content, $modal) {
					var confirm_button = new Upfront.Views.Editor.Field.Button({
							name: 'confirm',
							label: l10n.bg_changed_confirm,
							compact: true,
							classname: 'upfront-bg-setting-prompt-button',
							on_click: function () {
								// Reset all breakpoint background
								me.reset_responsive_background();
								prompt.close();
							}
						}),
						cancel_button = new Upfront.Views.Editor.Field.Button({
							name: 'cancel',
							label: l10n.bg_changed_cancel,
							compact: true,
							classname: 'upfront-bg-setting-prompt-button',
							on_click: function () {
								prompt.close();
							}
						})
					;
					$modal.addClass('upfront-bg-setting-prompt-modal');
					$content.html(
						'<p>' + l10n.bg_changed_prompt.replace('%s', title) + '</p>'
					);
					_.each([confirm_button, cancel_button], function (button) {
						button.render();
						button.delegateEvents();
						$content.append(button.$el);
					});
				}, this)
				.always(function(){
					prompt.remove();
				});
			},

			reset_responsive_background: function () {
				var me = this,
					breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled(),
					properties = [
						'background_type',
						// Color
						'background_color',
						// Images
						'background_image',
						'background_image_ratio',
						'background_style',
						'background_default',
						'background_repeat',
						'background_position',
						// Slider
						'background_slider_transition',
						'background_slider_rotate',
						'background_slider_rotate_time',
						'background_slider_control',
						'background_slider_images',
						// Video
						'background_video_mute',
						'background_video_autoplay',
						'background_video_style',
						'background_video',
						'background_video_embed',
						'background_video_width',
						'background_video_height',
						// Map
						'background_map_center',
						'background_map_zoom',
						'background_map_style',
						'background_map_controls',
						'background_show_markers',
						'background_use_custom_map_code',
						'background_map_location'
					]
				;
				_.each(breakpoints, function (each) {
					var breakpoint = each.toJSON();
					if ( breakpoint['default'] ) return;
					var data = Upfront.Util.clone(me.model.get_property_value_by_name('breakpoint') || {});
					if ( !_.isObject(data[breakpoint.id]) ) data[breakpoint.id] = {};
					_.each(properties, function (property) {
						if ( ! _.isUndefined(data[breakpoint.id][property]) ) {
							delete data[breakpoint.id][property];
						}
					});
					me.model.set_property('breakpoint', data, true);
				});
			},

			render_modal_tab: function (tab, $tab, $content) {
				switch (tab){
					case 'color':
						this.render_modal_tab_color($tab);
						break;
					case 'image':
						this.render_modal_tab_image($tab, tab);
						break;
					case 'featured':
						this.render_modal_tab_image($tab, tab);
						break;
					case 'slider':
						this.render_modal_tab_slider($tab);
						break;
					case 'map':
						this.render_modal_tab_map($tab);
						break;
					case 'video':
						this.render_modal_tab_video($tab);
						break;
				}
			},

			_render_tab_template: function($target, primary, secondary, template){
				var $template = $(bg_setting_tpl),
					$tab = false,
					tpl = false
				;
				if (template) {
					tpl = _.template($template.find('#upfront-bg-setting-tab-'+template).html());
				} else {
					tpl = _.template($template.find('#upfront-bg-setting-tab').html());
				}
				if (tpl) $tab = $('<div>' + tpl() + '</div>');
				$tab.find('.upfront-bg-setting-tab-primary').append(primary);
				if ( secondary ) $tab.find('.upfront-bg-setting-tab-secondary').append(secondary);
				$target.html('');
				$target.append($tab);
			},

			// Color tab
			render_modal_tab_color: function ($tab) {
				if ( ! this._color_item ){
					this._color_item = new Upfront.Views.Editor.BgSettings.ColorItem({
						model: this.model
					});
					this._color_item.render();
				}
				this._color_item.trigger('show');
				this._render_tab_template($tab, this._color_item.$el, '');
			},

			// Image tab
			render_modal_tab_image: function ($tab, value) {
				if ( ! this._image_item ){
					this._image_item = new Upfront.Views.Editor.BgSettings.ImageItem({
						model: this.model
					});
					this._image_item.render();
					this.$_image_primary = this._image_item.$el.find('.uf-bgsettings-image-style, .uf-bgsettings-image-pick');
				}
				this._image_item.trigger('show');
				this._render_tab_template($tab, this.$_image_primary, this._image_item.$el);
			},

			// Slider tab
			render_modal_tab_slider: function ($tab) {
				if ( ! this._slider_item ) {
					this.$_slides = $('<div class="upfront-bg-slider-slides"></div>'),
						this._slider_item = new Upfront.Views.Editor.BgSettings.SliderItem({
							model: this.model,
							slides_item_el: this.$_slides
						});
					this._slider_item.render();
					this.$_slider_primary = this._slider_item.$el.find('.uf-bgsettings-slider-transition');
				}
				this._slider_item.trigger('show');
				this._render_tab_template($tab, this.$_slider_primary, [this._slider_item.$el, this.$_slides]);
			},

			// Map tab
			render_modal_tab_map: function ($tab) {
				if ( ! this._map_item ){
					this._map_item = new Upfront.Views.Editor.BgSettings.MapItem({
						model: this.model
					});
					this._map_item.render();
				}
				this._map_item.trigger('show');
				this._render_tab_template($tab, '', this._map_item.$el);
			},

			// Video tab
			render_modal_tab_video: function ($tab) {
				if ( ! this._video_item ) {
					this._video_item = new Upfront.Views.Editor.BgSettings.VideoItem({
						model: this.model
					});
					this._video_item.render();
				}
				this._video_item.trigger('show');
				this._render_tab_template($tab, '', this._video_item.$el);
			}
		});

	});
}(jQuery));
