(function ($) {
define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'text!elements/upfront-youtube/tpl/youtube.html',
	'text!elements/upfront-youtube/tpl/clonevideo.html'
], function(ElementSettings, RootSettingsPanel, youtubeTpl, cloneTpl) {

var l10n = Upfront.Settings.l10n.youtube_element;

var UyoutubeModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = _.clone(Upfront.data.uyoutube.defaults);
		properties.element_id = Upfront.Util.get_unique_id("youtube-object");
		this.init_properties(properties);
	}
});

var UyoutubeView = Upfront.Views.ObjectView.extend({
	model: UyoutubeModel,
	youtubeTpl: Upfront.Util.template(youtubeTpl),
	elementSize: {width: 0, height: 0},

	initialize: function(){
		var me = this;
		if(! (this.model instanceof UyoutubeModel)){
			this.model = new UyoutubeModel({properties: this.model.get('properties')});
		}

		var parent = this.parent_module_view, me = this;

		this.delegateEvents();

		this.model.get("properties").bind("change", this.render, this);
		this.model.get('properties').bind('change', this.handle_visual_padding_hint, this);
		this.model.get("properties").bind("add", this.render, this);
		this.model.get("properties").bind("remove", this.render, this);

		this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.onResizeStop);

	},
	
	on_element_resize_start: function (attr) {
		//Append overlay div to prevent Iframe hijack drag event
		this.$el.find('.upfront-object-content').append('<div class="object-view-overlay" />');
	},
	
	on_element_resize: function (attr) {
		//Remove overlay div
		this.$el.find('.object-view-overlay').remove();
		
		//Update player size on resize
		this.onResizeStop(this);
	},
	
	get_content_markup: function () {
		var rendered,
		props = this.extract_properties();

		this.trimListTitle();

		rendered = this.youtubeTpl(this.extract_properties());

		if(this.property('youtube_status') === 'starting' && !props.multiple_videos){
		rendered += '<div class="upfront-youtube-starting-select upfront-initial-overlay-wrapper">' +
			'<div class="upfront-youtube-starting-wrapper upfront-initial-overlay-wrapper" style="height: 110px;">' +
			'<div class="upfront-youtube-starting-text">'+ l10n.enter_url +'</div>'+
			'<div class="upfront-youtube-box-wrapper"><input type="text" class="upfront-youtube-url" placeholder="'+ l10n.url_placeholder +'" /></div>' +
			'<div class="upfront-youtube-button-wrapper"><button type="button" class="upfront-youtube-button">'+ l10n.submit_button +'</button></div>'+
			'</div></div>';
		}

		return rendered;
	},

	trimListTitle: function() {
		var me = this;
		var props = this.extract_properties();

		if(props.multiple_videos !== null && typeof props.multiple_videos === 'object') {
			$.each(props.multiple_videos, function(index, video) {
				if (video.title && !video.original_title) video.original_title = video.title;
				if (video.title && video.original_title) {
					video.title = video.original_title.substring(0, me.property('multiple_title_length'));
				}
			});
		}
	},

	extract_properties: function() {
		var props = {};
		this.model.get('properties').each(function(prop){
			props[prop.get('name')] = prop.get('value');
		});
		return props;
	},

	onResizeStop: function(view, model, ui) {
		var width;
		if(this.property('youtube_status') !== 'starting'){
			width = this.$el.find('.upfront-object-content').width();
			this.property('player_height', parseInt(width/1.641, 10));
			this.property('player_width', width, false);
		}
	},
	
	addVideo: function(videoInput) {
		me.property('youtube_status', 'ok');
		//Add first video
		me.property('multiple_source_1', videoInput);

		Upfront.Events.trigger("entity:settings:activate", me);

		//Call resize function to match player width with object width
		me.onResizeStop();

		//Delay events else values are empty
		setTimeout(function(){
			// Trigger settings
			me.on_settings_click();

			//Trigger event for adding videos to array
			Upfront.Events.trigger("upfront:youtube:added");

		}, 50);
	},

	on_render: function() {
		me = this;

		this.$el.find('.upfront-youtube-button').on('click', function(e) {

			var videoInput = $(this).parents().find('input.upfront-youtube-url').val();
			
			//Check if video is valid
			if(videoInput) {
				if (videoInput.match(/youtu\.be/)) {
					videoMatch = videoInput.match(/^(https?:\/\/)?youtu.be\/([0-9a-zA-Z\-_]{11})/);
					if(videoMatch !== null && videoMatch.length > 0) {
						me.addVideo(videoInput);
					} else {
						Upfront.Views.Editor.notify(l10n.validMessage, 'error');
					}
				} else {
					videoMatch = videoInput.match(/^(https?:\/\/(www\.)?)?youtube\.com\/watch\?v=([0-9a-zA-Z\-_]{11}).*/);
					if(videoMatch !== null && videoMatch.length > 0) {
						me.addVideo(videoInput);
					} else {
						Upfront.Views.Editor.notify(l10n.validMessage, 'error');
					}
				}
			}

		});

		this.$el.find('.upfront-youtube-url').on('keydown', function(e) {
			if(e.which == 13) {
				me.$el.find('.upfront-youtube-button').click();
				Upfront.Events.trigger("upfront:element:edit:stop");
			}
		});
	},

	property: function(name, value, silent) {
		if(typeof value != "undefined") {
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	}
});

var YoutubeElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 110,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-youtube');
		this.$el.html('YouTube');
	},
	add_element: function () {
		var object = new UyoutubeModel(),
		module = new Upfront.Models.Module({
			"name": "",
			"properties": [
				{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
				{"name": "class", "value": "c11 upfront-youtube_module"},
				{"name": "has_settings", "value": 0},
				{"name": "row", "value": Upfront.Util.height_to_row(225)}
			],
			"objects": [
				object
			]
		});
		this.add_module(module);
	}
});

var Disablable_Field_Number = Upfront.Views.Editor.Field.Text.extend({
	on_render: function(){
		var className = 'upfront-field-wrap upfront-field-wrap-number';
		if (!this.options.disabled)
			className += ' upfront-field-wrap-disabled';
			this.el.className = className;
	},

	get_field_html: function () {
		var attr = {
		'type': 'number',
		'class': 'upfront-field upfront-field-number',
		'id': this.get_field_id(),
		'name': this.get_field_name(),
		'value': this.get_saved_value(),
		'min': this.options.min,
		'max': this.options.max,
		'step': this.options.step
		};

		if (this.options.disabled) attr.disabled = 'disabled';
		return ' <input ' + this.get_field_attr_html(attr) + ' /> ' + (this.options.suffix ? this.options.suffix : '');
	}
});

var BehaviorPanel = RootSettingsPanel.extend({
	className: 'uyoutube-settings',
	tabbed: false,
	title: l10n.general_settings,
	initialize: function (opts) {
		this.options = opts;
		var render_all = function(){
			this.settings.invoke('render');
		},
		me = this,
		SettingsItem =  Upfront.Views.Editor.Settings.Item,
		Fields = Upfront.Views.Editor.Field
		;

		this.model.on('doit', render_all, this);

		this.settings = _([
		new SettingsItem({
			className: 'optional-field align-center general_settings_item',
			title: l10n.apperance_title,
			fields: [
				new Fields.Radios({
					model: this.model,
					property: 'display_style',
					layout: "horizontal",
					label: l10n.display_style,
					className: 'field-display_style upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
					values: [
						{
							label: l10n.gallery_label,
							value: 'gallery',
						},
						{
							label: l10n.list_label,
							value: 'list',
						}
					]
				}),

				new Fields.Checkboxes({
					model: this.model,
					property: 'first_to_thumbnails',
					className: 'first-video-to-thumbnails',
					default_value: ['1'],
					values: [
						{ label: l10n.first_to_thumbnails, value: '1' },
					],
					change: function(value) {
						this.model.set_property('first_to_thumbnails', value);
					}
				}),

				new Fields.Checkboxes({
					model: this.model,
					property: 'multiple_show_title',
					label: "",
					values: [
						{ label: "", value: 'multiple_show_title' },
					]
				}),
				new Fields.Number({
					model: this.model,
					property: 'multiple_title_length',
					label: l10n.title_limit,
					label_style: 'inline',
					suffix: l10n.characters_label,
					min: 50,
					max: 100,
					step: 1,
					default_value: 100
				}),

				new Fields.Slider({
					model: this.model,
					property: 'thumbWidth',
					className: 'thumbnails-width',
					min: 100,
					max: 250,
					step: 5,
					label: l10n.thumbnail_size,
					valueTextFilter: function(value){
						return '(' + value + 'px x ' + me.model.get_property_value_by_name('thumbHeight') + 'px)';
					}
				}),
				new Fields.Hidden({
					model: this.model,
					property: 'thumbHeight'
				})
			]
		}),
		new SettingsItem({
			model: this.model,
			title: l10n.videos_title,
			className: 'multiple_video_section general_settings_item',
			fields: [
				new Fields.Text({
					model: this.model,
					label: l10n.default_video,
					className: 'multiple_sources yt_first_video',
					property: 'multiple_source_1',
					placeholder: l10n.video_placeholder
				}),
			],
		}),
		new SettingsItem({
			model: this.model,
			className: 'upfront-add-another-wrapper',
			fields: [
			new Fields.Button({
				className: 'upfront-add-another',
				label: l10n.add_video,
				compact: true,
				on_click: function(){
					me.cloneMultipleVideo();
				}
			}),
			]
		}),
		new Upfront.Views.Editor.Settings.Settings_CSS({model: this.model }),
		]);

		this.$el
		.on('change', 'input[name=display_style]', function(e){
			me.changeDisplayStyle(e);
		})
		.on('change', 'input[name=thumbWidth]', function(e) {
			me.onThumbChangeSize(e);
		})
		;
		this.on('concealed', this.setFieldEvents, this);
	},

	get_label: function () {
		return l10n.settings;
	},

	get_title: function () {
		return l10n.settings;
	},

	render: function() {
		var me = this;
		RootSettingsPanel.prototype.render.call(this);

		this.listMultipleVideos();
		setTimeout(function(){
			me.toggleMultipleSettings();
		}, 50);

		// Inline checkboxes
		this.$el.find('[name^=multiple_show_title], [name^=show_title], [name^=show_description]').parent().css({
		'float': 'left',
		'margin-top': '22px'
		});
	},

	toggleMultipleSettings: function() {
		//If multiple videos added show multiple videos settings
		var videosCount = $('[name^="multiple_source_"]').length;
		if(videosCount > 1) {
			$('.field-display_style, .first-video-to-thumbnails, .thumbnails-width').show();
		} else {
			$('.field-display_style, .first-video-to-thumbnails, .thumbnails-width').hide();
		}
	},

	onThumbChangeSize: function(e){
		var me = this,
		factor = 1.8, // Got to this value by trail and error
		offsetFactor = 10.4,
		width = $(e.target).val(),
		height = Math.round($(e.target).val() / factor),
		thumbOffset = Math.round($(e.target).val() / offsetFactor)
		;
		this.$('input[name=thumbHeight]').val(height);

		this.property('thumbWidth', width);
		this.property('thumbOffset', thumbOffset);
		this.property('thumbHeight', height, false);

		return height;
	},

	changeDisplayStyle: function(e) {
		this.property('display_style', $(e.currentTarget).val(), false);
		this.toggleDescriptionEnabled();
	},

	toggleDescriptionEnabled: function() {
		if (this.property('display_style') === 'gallery') {
		this.$el.find('[name=multiple_description_length]')
			.attr('disabled', 'disabled')
			.parent()
			.addClass('upfront-field-wrap-disabled')
		;

		return;
		}

		this.$el.find('[name=multiple_description_length]')
			.removeAttr('disabled')
			.parent()
			.removeClass('upfront-field-wrap-disabled')
		;

		this.$el.find('[name=multiple_show_description]')
			.removeAttr('disabled')
			.parent()
			.removeClass('upfront-field-multiple-disabled')
		;
	},

	property: function(name, value, silent) {
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
				return this.model.set_property(name, value, silent);
		}

		return this.model.get_property_value_by_name(name);
	},

	//Listing all videos fields when settings panel is opened
	listMultipleVideos: function() {
		var videos = this.model.get_property_value_by_name('multiple_videos');
		var me = this;
		if(videos.length > 0) {
			//Empty the container to prevent field duplicate
			me.$el.find('.multiple_video_section').html('<div class="upfront-settings-item-title"><span>'+ l10n.videos_title +'</span></div>');
			$(videos).each(function( index, element ) {
				me.$el.find('.multiple_video_section').append(_.template(cloneTpl, {
					cloneId: index + 1,
					videoUrl: element.video_url,
					l10n: l10n.template
				}));
			});
		}

	},

	//Adding new set of fields from template
	cloneMultipleVideo: function() {
		var panel_count = $('.multiple_video_section .upfront-settings-item').length;
		$('.multiple_video_section').append(_.template(cloneTpl, {
			cloneId: panel_count + 1,
			videoUrl: '',
			l10n: l10n.template
		}));
		this.toggleMultipleSettings();
	}
});

var YoutubeSettings = ElementSettings.extend({
	panels: {
		'Behavior': BehaviorPanel
	},
	events: {
		'click .upfront-save_settings' : 'saveSettings',
		'click .upfront-cancel_settings' : 'cancelSettings',
		'change .multiple_sources': 'multipleVideos',
	},

	initialize: function (options) {
		this.constructor.__super__.initialize.call(this, options);

		this.listenTo(Upfront.Events, "upfront:youtube:added", this.multipleVideos);
	},

	actions: {
		'single': 'upfront_youtube_single',
	},

	multipleVideos: function(event) {
		var me = this;
		var multiple_videos_array = [];
		var videoCounter = 0;
		var videoFields = $('[name^="multiple_source_"]');
		//Get all videos urls
		videoFields.each(function( index, element ) {
			var videoUrl = $(element).val();
			var elementId = index + 1;
			//Get video settings
			var videoId;
			var videoMatch;
			if(videoUrl) {
				if (videoUrl.match(/youtu\.be/)) {
					videoMatch = videoUrl.match(/^(https?:\/\/)?youtu.be\/([0-9a-zA-Z\-_]{11})/);
					if(videoMatch !== null && videoMatch.length > 0) {
						videoId = videoMatch[2];
					} else {
						Upfront.Views.Editor.notify(l10n.validMessage, 'error');
					}
				} else {
					videoMatch = videoUrl.match(/^(https?:\/\/(www\.)?)?youtube\.com\/watch\?v=([0-9a-zA-Z\-_]{11}).*/);
					if(videoMatch !== null && videoMatch.length > 0) {
						videoId = videoMatch[3];
					} else {
						Upfront.Views.Editor.notify(l10n.validMessage, 'error');
					}
				}
				var data = {'video_id': videoUrl};

				Upfront.Util.post({"action": me.actions.single, "data": data})
					.success(function (response) {
						multiple_videos_array.push({
							order: elementId,
							title: response.data.video.title,
							id: videoId,
							video_url: videoUrl,
							thumbnail: response.data.video.thumbnail_url
						});
						videoCounter++;
					})
					.error(function () {
						Upfront.Util.log("error single video");
					})
					.done(function () {
						if(videoCounter == videoFields.length) {
							multiple_videos_array.sort(function(a,b) { return a.order - b.order; });
							me.for_view.model.set_property('multiple_videos', multiple_videos_array, false);
						}
					})
					;
			}
			else {
				videoCounter++;
			}
		});
	},
	title: l10n.element_settings,
	get_title: function () {
		return l10n.element_settings;
	}
});

Upfront.Application.LayoutEditor.add_object("Uyoutube", {
	"Model": UyoutubeModel,
	"View": UyoutubeView,
	"Element": YoutubeElement,
	"Settings": YoutubeSettings,
	'anchor': {
		is_target: false
	},
	cssSelectors: {
		'.upfront-youtube-container': { label: l10n.css.global_wrapper_label, info: l10n.css.global_wrapper_info },
		'.uyoutube-thumbnails': { label: l10n.css.thumbnails_wrapper_label, info: l10n.css.thumbnails_wrapper_info},
		'.uyoutube-thumbnail': { label: l10n.css.thumbnail_label, info: l10n.css.thumbnail_info }
	},
	cssSelectorsId: 'UyoutubeModel'
});

Upfront.Models.UyoutubeModel = UyoutubeModel;
Upfront.Views.UyoutubeView = UyoutubeView;

}); //End require

})(jQuery);
