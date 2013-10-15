(function ($) {

  var templates = [
    'text!' + Upfront.data.uyoutube.template
  ];

  require(templates, function(youtubeTpl) {
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
      sizes: false,
      elementSize: {width: 0, height: 0},
      youtubeId: 0,
      youtubeSize: {width: 0, height: 0},
      youtubeOffset: {top: 0, left: 0},
      maskOffset: {top: 0, left: 0},
      youtubeInfo : false,

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

        $('body').on('dragover', function(e){
          e.preventDefault();
          me.handleDragEnter(e);
        })
        .on('dragenter', function(e){
          me.handleDragEnter(e);
          console.log('enter '  + me.property('element_id'));
        })
        .on('dragleave', function(e){
          me.handleDragLeave(e);
        })
        .on('drop', function(e){
          console.log('drop body');
        })
        ;

        this.model.get("properties").bind("change", this.render, this);
        this.model.get("properties").bind("add", this.render, this);
        this.model.get("properties").bind("remove", this.render, this);
      },

      setType: function(e) {
        this.property('youtube_status', 'ok');
        if ($(e.currentTarget).hasClass('single-video')) {
          this.property('type', 'single', false);
        } else {
          this.property('type', 'multiple', false);
        }
      },

      showPlayer: function() {
        var me = this,
          videoId, tag, firstScriptTag, player
        ;
        // asdfg
        videoId = this.property('single_video_url').match(/^(https?:\/\/(www\.)?)?youtube\.com\/watch\?v=([0-9a-zA-Z\-_]{11}).*/)[3];

        // If YT is defined YouTube IFrame Player init already
        if (typeof YT === 'undefined') {
          tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          player;
          window.onYouTubeIframeAPIReady = function() {
            player = new YT.Player('youtube-player-' + me.property('element_id'), {
              height: '390',
              width: '640',
              videoId: videoId,
              events: {
                // 'onReady': onPlayerReady,
                // 'onStateChange': onPlayerStateChange
              }
            });
          }
        } else {
          player = new YT.Player('youtube-player-' + me.property('element_id'), {
            height: '390',
            width: '640',
            videoId: videoId,
            events: {
              // 'onReady': onPlayerReady,
              // 'onStateChange': onPlayerStateChange
            }
          });
        }
      },

      get_content_markup: function () {
        var props = this.extract_properties();

        var rendered = this.youtubeTpl(props);

        if (this.property('type') === 'single' &&
            this.property('single_video_url')
        ) {
          this.showPlayer();
        }

        if(this.property('youtube_status') === 'starting'){
          rendered += '<div class="upfront-image-starting-select" style="min-height:' + this.elementSize.height + 'px">' +
            '<span class="upfront-image-resizethiselement">Video List or Single Video</span>'+
            '<div class="upfront-image-resizing-icons">' +
            '<a class="upfront-image-select-button button single-video" href="#">S</a>' +
            '<a class="upfront-image-select-button button multiple-videos" href="#">M</a>' +
            '</div>'+
            '</div>';
        }

        return rendered;
      },

      extract_properties: function() {
        var props = {};
        this.model.get('properties').each(function(prop){
          props[prop.get('name')] = prop.get('value');
        });
        return props;
      },

      handleDragEnter: function(e){
        console.log('youtube handleDragEnter');
      },

      handleDragLeave: function(e){
        console.log('youtube handleDragLeave');
      },

      onElementResize: function(view, model, ui){
        console.log('youtube onElementResize');
      },
      setElementSize: function(ui){
        console.log('youtube setElementSize');
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
      priority: 200,
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
            {"name": "class", "value": "c6 upfront-youtube_module"},
            {"name": "has_settings", "value": 0}
          ],
          "objects": [
            object
          ]
        })
        ;
        this.add_module(module);
      }
    });

    var YoutubeSettings = Upfront.Views.Editor.Settings.Settings.extend({
      events: {
        'change [name="video_url"]': 'singleVideo'
      },
      actions: {
        'single': 'upfront_youtube_single',
        'multiple': 'upfront_youtube_multiple'
      },
      singleVideo: function(event) {
        var me = this;
        var videoUrl = $(event.currentTarget).val();
        var videoId = videoUrl.match(/^(https?:\/\/(www\.)?)?youtube\.com\/watch\?v=([0-9a-zA-Z\-_]{11}).*/)[3];
        //TODO check if input is correct youtube url
        var data = {'video_id': videoId};
        Upfront.Util.post({"action": this.actions.single, "data": data})
          .success(function (response) {
            me.for_view.model.set_property('title', response.data.video.title, false);
            me.for_view.model.set_property('description', response.data.video.description, false);
            me.for_view.model.set_property('single_video_url', videoUrl);
          })
          .error(function () {
            Upfront.Util.log("error single video");
          })
        ;
      },
      initialize: function () {
        this.panels = _([
          new BehaviorPanel({model: this.model})
        ]);
      },
      get_title: function () {
        return "YouTube settings";
      }
    });

    var BehaviorPanel = Upfront.Views.Editor.Settings.Panel.extend({
      tabbed: true,
      initialize: function () {
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
            icon: 'contact-above-field',
            property: 'type',
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
                title: 'Custom Options',
                fields: [
                  new Fields.Radios({
                  model: this.model,
                  property: 'multiple_source',
                  layout: "horizontal-inline",
                  values: [
                      {
                      label: 'User Channel',
                      value: 'user_channel',
                    },
                    {
                      label: 'Playlist',
                      value: 'playlist',
                    }
                    ]
                  }),
                  new Fields.Text({
                    model: this.model,
                    property: 'multiple_source_id',
                    label: "",
                    placeholder: "YouTube Username or Channel ID"
                  }),
                  new Fields.Number({
                    model: this.model,
                    property: 'videos_count',
                    label: "Display",
                    label_style: 'inline',
                    suffix: "latest Videos",
                    min: 3,
                    max: 60,
                    step: 3,
                    default_value: 6
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
                  }),
                  new Fields.Slider({
                    model: this.model,
                    property: 'thumbWidth',
                    min: 100,
                    max: 250,
                    step: 5,
                    label: 'Thumbnail Size',
                    // info: 'Slide to resize the thumbnails.',
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
            icon: 'contact-above-field',
            property: 'type',
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
          .on('change', 'input[name=when_clicked]', function(e){
            me.toggleLink();
          })
          .on('change', 'input[name=caption_position]', function(e){
            me.toggleCaptionSettings();
          })
        ;
        this.on('concealed', this.setFieldEvents, this);
      },
      get_label: function () {
        return 'YouTube';
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
      }
    });


    Upfront.Application.LayoutEditor.add_object("Uyoutube", {
      "Model": UyoutubeModel,
      "View": UyoutubeView,
      "Element": YoutubeElement,
      "Settings": YoutubeSettings
    });

    Upfront.Models.UyoutubeModel = UyoutubeModel;
    Upfront.Views.UyoutubeView = UyoutubeView;

  }); //End require

})(jQuery);
