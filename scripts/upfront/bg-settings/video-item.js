(function($) {

var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'scripts/upfront/bg-settings/mixins'
], function(Mixins) {

	var VideoItem = Upfront.Views.Editor.Settings.Item.extend(_.extend({}, Mixins, {
		group: false,
		initialize: function (options) {
			var me = this,
				fields = {
					mute: new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						property: 'background_video_mute',
						use_breakpoint_property: true,
						default_value: 1,
						layout: 'horizontal-inline',
						multiple: false,
						values: [ { label: l10n.mute_on_play, value: 1 } ],
						change: function () {
							var value = this.get_value();
							this.model.set_breakpoint_property(this.property_name, value ? 1 : 0);
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-video-mute');
						}
					}),
					autoplay: new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						property: 'background_video_autoplay',
						use_breakpoint_property: true,
						default_value: 1,
						layout: 'horizontal-inline',
						multiple: false,
						values: [ { label: l10n.autoplay, value: 1 } ],
						change: function () {
							var value = this.get_value();
							this.model.set_breakpoint_property(this.property_name, value ? 1 : 0);
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-video-autoplay');
						}
					}),
					loop: new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						property: 'background_video_loop',
						use_breakpoint_property: true,
						default_value: 1,
						layout: 'horizontal-inline',
						multiple: false,
						values: [ { label: l10n.loop, value: 1 } ],
						change: function () {
							var value = this.get_value();
							this.model.set_breakpoint_property(this.property_name, value ? 1 : 0);
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-video-loop');
						}
					}),
					style: new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: 'background_video_style',
						use_breakpoint_property: true,
						layout: 'horizontal-inline',
						default_value: ["crop"],
						values: [
							{ label: l10n.scale_and_crop, value: "crop" },
							{ label: l10n.no_crop_embed, value: "full" },
							{ label: l10n.no_crop_bg, value: "inside" }
						],
						change: function () {
							var value = this.get_value();
							if ( value == 'inside' )
								fields.color.$el.show();
							else
								fields.color.$el.hide();
							this.model.set_breakpoint_property(this.property_name, value);
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-video-style');
						}
					}),
					color: new Upfront.Views.Editor.Field.Color({
						model: this.model,
						label: l10n.area_bg_color + ":",
						label_style: 'inline',
						property: 'background_color',
						use_breakpoint_property: true,
						default_value: '#ffffff',
						spectrum: {
							move: function (color) {
								me.preview_color(color);
							},
							change: function (color) {
								me.update_color(color);
							},
							hide: function (color) {
								me.reset_color();
							}
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-video-color');
						}
					}),
					video: new Upfront.Views.Editor.Field.Text({
						model: this.model,
						label: l10n.video_url,
						property: 'background_video',
						use_breakpoint_property: true,
						default_value: '',
						placeholder: l10n.video_source,
						change: function () {
							var value = this.get_value();
							if ( value ){
								me.model.set_breakpoint_property('background_video_embed', "");
								me.get_video_embed(value).done(function(response){
									if ( !response.data || !response.data.width || !response.data.height )
										return;
									me.model.set_breakpoint_property('background_video_width', response.data.width);
									me.model.set_breakpoint_property('background_video_height', response.data.height);
									me.model.set_breakpoint_property('background_video_embed', response.data.html);
								});
							}
							this.model.set_breakpoint_property(this.property_name, value);
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-video-url');
						}
					})
				};

			this.$el.addClass('uf-bgsettings-item uf-bgsettings-videoitem');

			options.fields = _.map(fields, function(field){ return field; });

			this.on('show', function(){
				fields.style.trigger('changed');
			});

			this.bind_toggles();
			this.constructor.__super__.initialize.call(this, options);
		},
		get_video_embed: function (url) {
			return Upfront.Util.post({
				action: "upfront-media-get_embed_raw",
				media: url
			});
		}
	}));

	return VideoItem;
});
})(jQuery);
