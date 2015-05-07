(function ($) {

  define([
    'text!elements/upfront-youtube/tpl/youtube.html',
	'text!elements/upfront-youtube/tpl/clonevideo.html'
    ], function(youtubeTpl, cloneTpl) {
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
        this.events = _.extend({}, this.events, {
          'click .single-video': 'setType',
          'click .multiple-videos': 'setType'
        });
        this.delegateEvents();

        this.model.get("properties").bind("change", this.render, this);
        this.model.get("properties").bind("add", this.render, this);
        this.model.get("properties").bind("remove", this.render, this);

        Upfront.Events.on("entity:resize_stop", this.onResizeStop, this);

		this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.onResizeStop);

      },
      setType: function(event) {
				event.preventDefault();
        var self = this;
        this.property('youtube_status', 'ok');
        if ($(event.currentTarget).hasClass('single-video')) {
          this.property('videoType', 'single', false);
        } else {
          this.property('videoType', 'multiple', false);
        }

				Upfront.Events.trigger("entity:settings:activate", this);
        setTimeout(function(){
          self.$(".upfront-entity-settings_trigger").click();
        }, 100);
      },
      get_content_markup: function () {
        var rendered,
          props = this.extract_properties();

        this.model.set_property('description', props.full_description.substring(0, props.description_length));
        this.model.set_property('title', props.full_title.substring(0, props.title_length));

        if (props.videoType === 'multiple' && props.display_style === 'list') {
          this.trimListDescriptions();
        }
		
        rendered = this.youtubeTpl(this.extract_properties());

        if(this.property('youtube_status') === 'starting'){
          rendered += '<div class="upfront-youtube-starting-select" style="min-height:' + this.elementSize.height + 'px">' +
            '<span class="upfront-youtube-starting-title">Video List or Single Video?</span>'+
            '<div class="upfront-youtube-resizing-icons">' +
            '<a class="upfront-youtube-select-button button multiple-videos" href=""><span class="yticon"></span><span class="ytdesc">Multiple Videos</span></a>' +
            '<a class="upfront-youtube-select-button button single-video" href=""><span class="yticon"></span><span class="ytdesc">Single Video</span></a>' +
            '</div>'+
            '</div>';
        }

        return rendered;
      },

      trimListDescriptions: function() {
        var me = this;
        var props = this.extract_properties();
        $.each(props.multiple_videos, function(index, video) {
          if (video.original_description) {
            video.description = video.original_description.substring(0, me.property('multiple_description_length'));
          }
        });
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

      property: function(name, value, silent) {
        if(typeof value != "undefined"){
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
        })
        ;
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

    var YoutubeSettings = Upfront.Views.Editor.Settings.Settings.extend({
      events: {
        'change [name="video_url"]': 'singleVideo',
        'change .multiple_sources': 'multipleVideos',
		'change input': 'multipleVideos',
        'change [name="videoType"]': 'setType'
      },

      initialize: function (opts) {
		    this.options = opts;
        this.panels = _([
          new BehaviorPanel({model: this.model})
        ]);
      },

      actions: {
        'single': 'upfront_youtube_single',
        'channel': 'upfront_youtube_channel',
        'playlist': 'upfront_youtube_playlist'
      },

      singleVideo: function(event) {
        var me = this;
        var videoUrl = $(event.currentTarget).val();
		var videoId;
		if (videoUrl.match(/youtu\.be/)) {
			videoId = videoUrl.match(/^(https?:\/\/)?youtu.be\/([0-9a-zA-Z\-_]{11})/)[2];
		} else {
			videoId = videoUrl.match(/^(https?:\/\/(www\.)?)?youtube\.com\/watch\?v=([0-9a-zA-Z\-_]{11}).*/)[3];
		}
        //TODO check if input is correct youtube url
        var data = {'video_id': videoId};
        Upfront.Util.post({"action": this.actions.single, "data": data})
          .success(function (response) {
            me.for_view.model.set_property('full_title', response.data.video.title, false);
            me.for_view.model.set_property('full_description', response.data.video.description, false);
            me.for_view.model.set_property('single_video_id', videoId, false);
            me.for_view.model.set_property('single_video_url', videoUrl);
          })
          .error(function () {
            Upfront.Util.log("error single video");
          })
        ;
      },

      multipleVideos: function(event) {
        var me = this;
		var multiple_videos_array = [];
		
		//Get all videos urls
		$('[name^="multiple_source_"]').each(function( index, element ) {
			var videoUrl = $(element).val();
			var elementId = index + 1;
			//Get video settings
			var title_box = $('[name="multiple_show_title_' + elementId + '"]').prop('checked');
			var title_length = $('[name="multiple_title_length_' + elementId + '"]').val();
			var description_box = $('[name="multiple_show_description_' + elementId + '"]').prop('checked');
			var description_length = $('[name="multiple_description_length_' + elementId + '"]').val();
			var videoId;
			if(videoUrl) {
				if (videoUrl.match(/youtu\.be/)) {
					videoId = videoUrl.match(/^(https?:\/\/)?youtu.be\/([0-9a-zA-Z\-_]{11})/)[2];
				} else {
					videoId = videoUrl.match(/^(https?:\/\/(www\.)?)?youtube\.com\/watch\?v=([0-9a-zA-Z\-_]{11}).*/)[3];
				}

				var data = {'video_id': videoId};
				Upfront.Util.post({"action": me.actions.single, "data": data})
				  .success(function (response) {
					multiple_videos_array.push({
						title: response.data.video.title, 
						description: response.data.video.description, 
						id: videoId, 
						single_video_url: videoUrl,
						title_length: title_length,
						title_box: title_box,
						description_length: description_length,
						description_box: description_box,
						thumbnail: 'http://img.youtube.com/vi/'+ videoId +'/hqdefault.jpg'
					});
				  })
				  .error(function () {
					Upfront.Util.log("error single video");
				  })
				;
			}	
        });
		
		me.for_view.model.set_property('multiple_videos', multiple_videos_array, false);
		
      },

      setType: function(event) {
        this.for_view.model.set_property('videoType', $(event.currentTarget).val(), false);
      },

      get_title: function () {
        return "YouTube settings";
      }
    });

    var BehaviorPanel = Upfront.Views.Editor.Settings.Panel.extend({
      className: 'uyoutube-settings',
      tabbed: true,
      initialize: function (opts) {
		    this.options = opts;
        var render_all = function(){
            this.settings.invoke('render');
          },
          me = this,
          SettingsItem =  Upfront.Views.Editor.Settings.Item,
          SettingsItemTabbed =  Upfront.Views.Editor.Settings.ItemTabbed,
          Fields = Upfront.Views.Editor.Field
        ;

        this.model.on('doit', render_all, this);

        this.settings = _([
          new SettingsItemTabbed({
            model: this.model,
            title: 'Multiple Videos',
            radio: true,
            is_default: true,
            icon: 'video-multiple',
            property: 'videoType',
            value: 'multiple',
            settings: [
              new SettingsItem({
                className: 'optional-field align-center',
                title: 'Display Style',
                fields: [
                  new Fields.Radios({
                  model: this.model,
                  property: 'display_style',
                  layout: "horizontal",
                  className: 'field-display_style upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
                  values: [
                      {
                      label: 'Gallery',
                      value: 'gallery',
                      icon: 'display-style-gallery'
                    },
                    {
                      label: 'List',
                      value: 'list',
                      icon: 'display-style-list'
                    }
                    ]
                  }),
                ]
              }),
              new SettingsItem({
                model: this.model,
                title: 'Video 1 Options',
				className: 'multiple_video_section',
                fields: [
                  new Fields.Text({
                    model: this.model,
					className: 'multiple_sources',
                    property: 'multiple_source_1',
                    label: "",
                    placeholder: "YouTube Video URL"
                  }),
                  new Fields.Checkboxes({
                    model: this.model,
                    property: 'multiple_show_title_1',
                    values: [
                      {
                        value: 'multiple_show_title',
                        label: ""
                      },
                    ]
                  }),
                  new Disablable_Field_Number({
                    model: this.model,
                    property: 'multiple_title_length_1',
                    label: "Title",
                    label_style: 'inline',
                    suffix: "characters",
                    min: 50,
                    max: 100,
                    step: 1,
                    default_value: 100
                  }),
                  new Fields.Checkboxes({
                    model: this.model,
                    property: 'multiple_show_description_1',
                    values: [
                      { 
						label: "", 
						value: 'multiple_show_description'
					  },
                    ]
                  }),
                  new Fields.Number({
                    model: this.model,
                    property: 'multiple_description_length_1',
                    label: "Description",
                    label_style: 'inline',
                    suffix: "characters",
                    min: 50,
                    max: 100,
                    step: 1,
                    default_value: 100
                  }),
				],
			}),
			new SettingsItem({
                model: this.model,
                fields: [
				  new Fields.Button({
					label: 'Add Video',
					compact: true,
					on_click: function(){
						me.cloneMultipleVideo();
					}
				  }),
                  new Fields.Slider({
                    model: this.model,
                    property: 'thumbWidth',
                    min: 100,
                    max: 250,
                    step: 5,
                    label: 'Thumbnail Size',
                    info: 'Slide to resize the thumbnails.',
                    valueTextFilter: function(value){
                      return '(' + value + 'px x ' + me.model.get_property_value_by_name('thumbHeight') + 'px)';
                    }
                  }),
                  new Fields.Hidden({
                    model: this.model,
                    property: 'thumbHeight'
                  })
                ]
              })
            ]
          }),
          new SettingsItemTabbed({
            model: this.model,
            title: 'Single Video',
            radio: true,
            is_default: false,
            icon: 'video-single',
            property: 'videoType',
            value: 'single',
            settings: [
              new SettingsItem({
                model: this.model,
                title: 'Custom Options',
                fields: [
                  new Fields.Text({
                    model: this.model,
                    property: 'video_url',
                    label: "",
                    placeholder: "Video URL"
                  }),
                  new Fields.Checkboxes({
                    model: this.model,
                    property: 'show_title',
                    label: "",
                    values: [
                      { label: "", value: 'show_title' },
                    ]
                  }),
                  new Fields.Number({
                    model: this.model,
                    property: 'title_length',
                    label: "Title",
                    label_style: 'inline',
                    suffix: "characters",
                    min: 50,
                    max: 100,
                    step: 1,
                    default_value: 100
                  }),
                  new Fields.Checkboxes({
                    model: this.model,
                    property: 'show_description',
                    label: "",
                    values: [
                      { label: "", value: 'show_description' },
                    ]
                  }),
                  new Fields.Number({
                    model: this.model,
                    property: 'description_length',
                    label: "Description",
                    label_style: 'inline',
                    suffix: "characters",
                    min: 50,
                    max: 100,
                    step: 1,
                    default_value: 100
                  })
                ]
              })
            ]
          })
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
        return 'Settings';
      },

      get_title: function () {
        return false;
      },

      render: function() {
        // Render as usual
        this.constructor.__super__.render.apply(this, arguments);
        // Remove panel tabs
        this.$el.find('.upfront-settings_label').remove();
        this.$el.find('.upfront-settings_panel').css('left', 0);
        this.toggleDescriptionEnabled();
		this.listMultipleVideos();
        // Inline checkboxes
        this.$el.find('[name^=multiple_show_description], [name^=multiple_show_title], [name^=show_title], [name^=show_description]').parent().css({
          'float': 'left',
          'margin-top': '22px'
        });
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
		//Empty the container
		me.$el.find('.multiple_video_section').html('');
		$(videos).each(function( index, element ) {  
			me.$el.find('.multiple_video_section').append(_.template(cloneTpl, { 
				cloneId: index + 1,
				videoUrl: element.single_video_url,
				titleLength: element.title_length,
				descriptionLength: element.description_length,
				titleCheckbox: element.title_box,
				descriptionCheckbox: element.description_box
			}));
		});

	  },
	  
	  //Adding new set of fields from template
	  cloneMultipleVideo: function() {
		var panel_count = $('.multiple_video_section .upfront-settings-item').length;
		$('.multiple_video_section').append(_.template(cloneTpl, { 
			cloneId: panel_count + 1,
			videoUrl: '',
			titleLength: 100,
			descriptionLength: 100,
			titleCheckbox: true,
			descriptionCheckbox: true
		}));
	  }
    });


    Upfront.Application.LayoutEditor.add_object("Uyoutube", {
      "Model": UyoutubeModel,
      "View": UyoutubeView,
      "Element": YoutubeElement,
      "Settings": YoutubeSettings,
      'anchor': {
        is_target: false
      }
    });

    Upfront.Models.UyoutubeModel = UyoutubeModel;
    Upfront.Views.UyoutubeView = UyoutubeView;

  }); //End require

})(jQuery);
