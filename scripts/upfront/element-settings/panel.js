(function ($) {
define([
	'scripts/upfront/element-settings/settings/padding-settings-module',
], function(PaddingSettings) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var ElementSettingsPanel = Backbone.View.extend(_.extend({}, Upfront.Views.Mixins.Upfront_Scroll_Mixin, {
		className: 'upfront-settings_panel_wrap',
		// For Anchor & Styles settings
		hide_common_anchors: false,
		hide_common_fields: false,

		events: {
			"click .upfront-cancel_settings": "on_cancel",
			"click .upfront-settings_label": "on_toggle",
			"click .upfront-settings-common_panel .upfront-settings-item-title": "on_toggle_common"
		},

		get_title: function () {
			return this.options.title ? this.options.title : '';
		},

		get_label: function () {
			return this.options.label ? this.options.label : '';
		},

		initialize: function (options) {
			var me = this;
			this.hide_common_fields = _.isUndefined(options.hide_common_fields) ? false : options.hide_common_fields;
			this.hide_common_anchors = _.isUndefined(options.hide_common_anchors) ? false : options.hide_common_anchors;
			me.options = options;
			this.settings = options.settings ? _(options.settings) : _([]);
			this.settings.each(function(setting){
				setting.panel = me;
				setting.trigger('panel:set');
			});
			this.tabbed = ( typeof options.tabbed != 'undefined' ) ? options.tabbed : this.tabbed;
		},

		tabbed: false,
		is_changed: false,

		render: function () {
			this.$el.html('<div class="upfront-settings_label" /><div class="upfront-settings_panel" ><div class="upfront-settings_panel_scroll" />');

			var $label = this.$el.find(".upfront-settings_label"),
				$panel = this.$el.find(".upfront-settings_panel"),
				$panel_scroll = this.$el.find(".upfront-settings_panel_scroll"),
				$common_panel,
				me = this
			;

			$label.append(this.get_label());
			this.settings.each(function (setting) {
				if ( ! setting.panel )
					setting.panel = me;
				setting.render();
				$panel_scroll.append(setting.el)
			});
			if ( this.options.min_height )
				$panel_scroll.css('min-height', this.options.min_height);
			if ( this.tabbed ) {
				var first_tab = this.settings.first();
				if ( !first_tab.radio )
					first_tab.reveal();
				$panel_scroll.append('<div class="upfront-settings-tab-height" />');
			}
			this.stop_scroll_propagation($panel_scroll);
			// Add common fields
			if (this.hide_common_fields === false) {
				this.$el.find('.upfront-settings_panel_scroll').after('<div class="upfront-settings-common_panel"></div>');
				$common_panel = this.$el.find(".upfront-settings-common_panel");
				if(typeof this.cssEditor == 'undefined' || this.cssEditor){
					// Adding CSS item
					var css_settings = new Upfront.Views.Editor.Settings.Settings_CSS({
						model: this.model,
						title: (false === this.hide_common_anchors ? l10n.css_and_anchor : l10n.css_styles)
					});

					css_settings.panel = me;
					css_settings.render();
					$common_panel.append(css_settings.el);
					
				}
				// Adding anchor trigger
				//todo should add this check again// if (this.options.anchor && this.options.anchor.is_target) {

				if (this.hide_common_anchors === false) {
					var anchor_settings = new Upfront.Views.Editor.Settings.AnchorSetting({model: this.model});
					anchor_settings.panel = me;
					anchor_settings.render();
					$common_panel.append(anchor_settings.el);
				}
				
				var padding_settings = new PaddingSettings({
					model: this.model
				});
				
				//Append element padding settings
				padding_settings.panel = me;
				padding_settings.render();
				$common_panel.append(padding_settings.el);

				// this.listenTo(anchor_settings, "anchor:item:updated", function () {
					// this.toggle_panel(first); //todo don't know what this was for should investigate
				// });
			}

			this.$el.fadeIn('fast', function() {
				// Scroll the window if settings box clips vertically
				var parent = me.$el.parent();
				var elementbottom = (parent.offset() ? parent.offset().top : 0) + parent.height();
				var winheight = jQuery(window).height();

				if( (elementbottom +60) > (winheight+jQuery('body').scrollTop()))
					jQuery('body').animate({scrollTop:(elementbottom - winheight + 60)}, 'slow');

			});
			this.trigger('rendered');
		},

		on_toggle_common: function () {
			var me = this;
			var panel = this.$el.find('.upfront-settings-common_panel');
			panel.toggleClass('open');
			if(panel.is('.open')) {
				this.$el.find('.upfront-settings-common_panel .upfront-settings-item-title span').first().html(l10n.element_css_styles);
			} else {
				this.$el.find('.upfront-settings-common_panel .upfront-settings-item-title span').first().html(
					(false === me.hide_common_anchors ? l10n.css_and_anchor : l10n.css_styles)
				);
			}
		},

		conceal: function () {
			this.$el.find(".upfront-settings_panel").hide();
			this.$el.find(".upfront-settings_label").removeClass("active");
			//this.$el.find(".upfront-settings_label").show();
			this.trigger('concealed');
		},

		reveal: function () {
			this.$el.find(".upfront-settings_label").addClass("active");
			//this.$el.find(".upfront-settings_label").hide();
			this.$el.find(".upfront-settings_panel").show();
			if ( this.tabbed ) {
				var tab_height = 0;
				this.$el.find('.upfront-settings-item-tab-content').each(function(){
					var h = $(this).outerHeight(true);
					tab_height = h > tab_height ? h : tab_height;
				});
				this.$el.find('.upfront-settings-tab-height').css('height', tab_height);
			}
			this.trigger('revealed');
		},

		show: function () {
			this.$el.show();
		},

		hide: function () {
			this.$el.hide();
		},

		is_active: function () {
			return this.$el.find(".upfront-settings_panel").is(":visible");
		},

		on_toggle: function () {
			this.trigger("upfront:settings:panel:toggle", this);
			this.show();
		},
		//@Furqan and this for Loading for pnaels
		start_loading: function (loading_message, loading_complete_message) {
			this.loading = new Upfront.Views.Editor.Loading({
				loading: loading_message,
				done: loading_complete_message
			});
			this.loading.render();
			this.$el.find(".upfront-settings_panel").append(this.loading.$el);
		},
		end_loading: function (callback) {
			if ( this.loading )
				this.loading.done(callback);
			else
				callback();
		},
		//end
		save_settings: function () {
			if (!this.settings) return false;

			var me = this;
			this.settings.each(function (setting) {
				if ( (setting.fields || setting.settings).size() > 0 ) {
					setting.save_fields();
				} else {
					var value = me.model.get_property_value_by_name(setting.get_name());
					if ( value != setting.get_value() )
						me.model.set_property(
							setting.get_name(),
							setting.get_value()
						);
				}
			});
		},

		on_cancel: function () {
			this.trigger("upfront:settings:panel:close", this);
		},

		cleanUp: function(){
			if(this.settings)
				this.settings.each(function(setting){
					setting.remove();
				});
			this.$el.off();
			this.remove();
		}

	}));

	return ElementSettingsPanel;
});
})(jQuery);
