(function($) {

var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'scripts/upfront/bg-settings/mixins',
	'scripts/upfront/video-selector'
], function(Mixins, VideoSelector) {

	var VideoItem = Upfront.Views.Editor.Settings.Item.extend(_.extend({}, Mixins, {
		group: false,
		initialize: function (options) {
			var me = this,
				fields;
			var videoSelector = new VideoSelector();

			var pickVideoButton = new Upfront.Views.Editor.Field.Button({
				label: l10n.browse,
				model: this.model,
				compact: true,
				classname: 'uf-button-alt uf-bgsettings-image-pick uf-bgsettings-video-pick',
				on_click: function(){
					videoSelector.open().done(function(videoData){
						videoSelector.close();
						// Reset stuff
						me.model.set_breakpoint_property('uploaded_background_video_embed', '');
						me.model.set_breakpoint_property('uploaded_background_video', '');
						me.model.set_breakpoint_property('background_video_embed', '');
						me.model.set_breakpoint_property('background_video', '');

						// Set new values
						me.model.set_breakpoint_property('background_video_width', videoData.width);
						me.model.set_breakpoint_property('background_video_height', videoData.height);
						me.model.set_breakpoint_property('uploaded_background_video_embed', videoData.embed);
						me.model.set_breakpoint_property('uploaded_background_video', videoData.id);
						me.model.set_breakpoint_property('type', 'uploaded_video');
					});
				}
			});
			var videoUrlInput = new Upfront.Views.Editor.Field.Text({
				model: this.model,
				label: l10n.video_url,
				property: 'background_video',
				use_breakpoint_property: true,
				default_value: '',
				placeholder: l10n.video_source,
				change: function () {
					var value = this.get_value();
					if ( value ){
						me.model.set_breakpoint_property('type', 'video');
						me.model.set_breakpoint_property('uploaded_background_video_embed', "");
						me.model.set_breakpoint_property('uploaded_background_video', '');
						me.model.set_breakpoint_property('background_video_embed', "");
						me.get_video_embed(value).done(function(response){
							if ( !response.data)
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
			});

			fields = {
					bg_style: new Upfront.Views.Editor.Field.Select({
						model: this.model,
						label: 'Video Source',
						className: 'upfront-field-wrap upfront-field-wrap-select background-video-style-field',
						property: 'background_style',
						use_breakpoint_property: true,
						default_value: 'upload',
						icon_class: 'upfront-region-field-icon',
						values: this.get_bg_style_values(),
						change: function () {
							var value = this.get_value();
							if ( value == 'upload' ){
								videoUrlInput.$el.hide();
								pickVideoButton.$el.show();
							}
							else if ( value == 'service' ) {
								pickVideoButton.$el.hide();
								videoUrlInput.$el.show();
							}
							me._bg_style = value;
							me.update_video();
						}
					}),
					pick_video: pickVideoButton,
					video: videoUrlInput,
					mute: new Upfront.Views.Editor.Field.Toggle({
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
					autoplay: new Upfront.Views.Editor.Field.Toggle({
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
					loop: new Upfront.Views.Editor.Field.Toggle({
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
					style: new Upfront.Views.Editor.Field.Select({
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
						label: l10n.bg_color_short,
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
					})
				};

			this.$el.addClass('uf-bgsettings-item uf-bgsettings-videoitem');

			options.fields = _.map(fields, function(field){ return field; });

			this.on('show', function(){
				fields.style.trigger('changed');
			});

			this.bind_toggles();
			this.constructor.__super__.initialize.call(this, options);

			setTimeout( function() {
				var currentStyle = me.model.get_breakpoint_property_value('background_style');
				if ( currentStyle === 'upload' ){
					videoUrlInput.$el.hide();
					pickVideoButton.$el.show();
				} else if (currentStyle === 'service' ) {
					pickVideoButton.$el.hide();
					videoUrlInput.$el.show();
				} else {
					me.model.set_breakpoint_property('background_style', 'upload');
					videoUrlInput.$el.hide();
					pickVideoButton.$el.show();
				}
			}, 50);
		},
		get_video_embed: function (url) {
			return Upfront.Util.post({
				action: "upfront-media-get_embed_raw",
				media: url
			});
		},
		get_bg_style_values: function () {
			var values = [
				{ label: 'Upload', value: 'upload' },
				{ label: 'Video Service', value: 'service' }
			];
			return values;
		},
		update_video: function () {
			var style = this._bg_style;
			this.model.set_breakpoint_property('background_style', style);
		}
	}));

	return VideoItem;
});
})(jQuery);
