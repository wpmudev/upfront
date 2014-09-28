;(function($){define(['upfront/post-editor/upfront-post-content', 'text!upfront/templates/popup.html', 'text!upfront/templates/image_variants.html'], function(ContentTools, tpls, variant_tpl){

var PostPartView = Upfront.Views.ObjectView.extend({
	initialize: function(opts){
		var me = this,
			postPart = this.model.get_property_value_by_name('postPart')
		;
		this.postPart = postPart;

//		console.log('initializing view');

		this.listenTo(Upfront.Events, 'entity:resize_start', this.close_settings);
		this.listenTo(Upfront.Events, 'entity:drag_start', this.close_settings);

		//Add the options to the model
		this.postView = Upfront.Application.PostLayoutEditor.postView;
		if(this.postView.partOptions && this.postView.partOptions[this.postPart]){
			_.each(this.postView.partOptions[this.postPart], function(value, key){
				me.model.set_property(key, value, true);
			});
		}


		this.listenTo(this.model.get('properties'), 'change add remove', this.updateOptions);

//		console.log(Upfront.Util.model_to_json(this.model));


		this.listenTo(this.postView.model, 'template:' + postPart, this.refreshTemplate);

		if(_upfront_post_data)
			this.post = Upfront.data.posts[_upfront_post_data.post_id];


		this.tpl = this.getTemplate();

		this.model.tpl = this.tpl;

		if(typeof this.init == 'function')
			this.init.apply(this, arguments);
	},

	get_content_markup: function(){
		var part = this.property('postPart'),
			markupper = ContentTools.getMarkupper(),
			template = this.getTemplate(),
			partContents = Upfront.Application.PostLayoutEditor.partMarkup,
			markup = markupper.markup(part, partContents, template)
		;

		if(markup)
			return markup;

		this.updatePartContent();
		return 'Loading';
	},

	on_render:function(){
		var options = this.postView.partOptions,
			partOptions = options[this.property('postPart')] || {}
		;
		if(partOptions.extraClasses)
			this.$('.upfront-object').addClass(partOptions.extraClasses);

		Upfront.Events.trigger('post:layout:partrendered', this);

//		console.log('post part rendered');
	},

	updateOptions: function(){
		var properties = this.model.get('properties').toJSON(),
			partOptions = {},
			options = this.postView.partOptions,
			staticProperties = ['', 'row', 'type', 'view_class', 'has_settings', 'id_slug', 'postPart', 'element_id']
		;

		if(_.isArray(options))
			options = {};

		_.each(properties, function(p){
			if(staticProperties.indexOf(p.name) == -1)
				partOptions[p.name] = p.value;
		});

		options[this.postPart] = partOptions;

		this.postView.partOptions = options;

		this.updatePartContent();
		this.$('.upfront-object-content').html('Loading');
	},

	updatePartContent: function(){
		var me = this,
			options = this.postView.partOptions || {},
			request = {
				action: 'content_part_markup',
				//Gagan: I made this little change below to accomodate the editor in the posts element
				post_id: this.postView.editor.postId?this.postView.editor.postId:this.post.id,
				parts: JSON.stringify([{slug: this.postPart, options: options[this.postPart] || {}}]),
				templates: {}
			}
		;

		request.templates[this.postPart] = this.getTemplate();

		Upfront.Util.post(request).done(function(response){
			_.extend(Upfront.Application.PostLayoutEditor.partMarkup, response.data.replacements);
			me.render();
		});
	},

	getTemplate: function(){
		var templates = this.postView.partTemplates;

		var part = this.postPart;

		if(part == 'contents' && this.postView.property('content_type') == 'excerpt')
			part = 'excerpt';

		if(templates && templates[part])
			return templates[part];

		return Upfront.data.thisPost.templates[part];
	},

	refreshTemplate: function(){
		this.model.tpl = this.getTemplate();
		this.render();
	},

	/*
	Shorcut to set and get model's properties.
	*/
	property: function(name, value, silent) {
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	}
});

var PostPartElement = Upfront.Views.Editor.Sidebar.Element.extend({
	className: "draggable-element upfront-no-select draggable-post-element",
	initialize: function(opts){
		console.log('initializing element');
		this.options = opts;
		this.title = opts.title;
		this.slug = this.title.toLowerCase().replace(' ', '_');
		this.Model = PostPartModel;
		this.View = partViews[this.slug] ? partViews[this.slug] : PostPartView;
        this.Settings = partSettings[this.slug] ? partSettings[this.slug] : PostPartSettings;
	},
	add_element: function(){
		var object = new this.Model({properties:{
				type: 'PostPart_' + this.slug + 'Model',
				view_class: 'PostPart_' + this.slug + 'View',
				has_settings: 1,
				id_slug: 'PostPart_' + this.slug,
				postPart: this.slug
			}}),
			module = new Upfront.Models.Module({
				name: '',
				properties: [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c10 post-part"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(100)}
				],
				objects: [object]
			})
		;
		this.add_module(module);
	}
});

var Settings = Upfront.Views.Editor.Settings,
	Fields = Upfront.Views.Editor.Field
;

var PostPartSettings = Settings.Settings.extend({
  has_tabs: false,
	initialize: function(opts){
		this.options = opts;
		this.cssEditor = false;
		this.postPart = this.model.get_property_value_by_name('postPart');

		if(typeof this.init == 'function')
			this.init(opts);

		this.updatePanels();
	},
	updatePanels: function(){
		var templateSetting = new Upfront.Views.Editor.Settings.Item({
			title: 'General setup',
			model: this.model,
			fields: [
				new TemplateEditorField({
					model: this.model
				})
			]
		});

		if(this.panels)
			this.panels.first().settings.push(templateSetting);
		else
			this.panels = _([
				new Settings.Panel({
					label: 'General',
					model: this.model,
					settings: [templateSetting]
				})
			])
		;
	}
});

var DateSettings = PostPartSettings.extend({
	init: function(opts){
		this.panels = _([
			new Settings.Panel({
        hide_common_fields: true,
				title: 'Date format',
				model: this.model,
				settings: [new Upfront.Views.Editor.Settings.Item({
					title: 'Date setup',
					model: this.model,
					fields: [
						new Fields.Text({
							label: 'PHP date format',
							property: 'format',
							model: this.model
						})
					]
				})]
			})
		]);
	}
});

var UpdateSettings =  DateSettings.extend();

var TagSettings = PostPartSettings.extend({
    init: function(opts){
        this.panels = _([
            new Settings.Panel({
                hide_common_fields: true,
                title: 'Tags',
                model: this.model,
                settings: [new Upfront.Views.Editor.Settings.Item({
                    title: 'Tags settings',
                    model: this.model,
                    fields: [
                        new Fields.Text({
                            label: 'Tags separator',
                            property: 'tag_separator',
                            model: this.model
                        })
                    ]
                })]
            })
        ]);
    }
});

var ContentSettings = PostPartSettings.extend({
	events: {
		'keyup .upfront-field-number': 'offsetChanged',
		'change .upfront-field-number': 'updatePadding'
	},
	init: function(opts){
	  this.panels = _([
	      new Settings.Panel({
            hide_common_fields: true,
	          title: 'Tags',
	          model: this.model,
	          settings: [new Upfront.Views.Editor.Settings.Item({
	              title: 'Content padding',
	              className: 'content-overflow-setting',
	              model: this.model,
						fields: [
							new Fields.Number({
								label: 'Left',
								property: 'padding_left',
								max : 3,
								min: 0,
								step : 1,
								model: this.model
							}),
							new Fields.Number({
								label: 'Right',
								property: 'padding_right',
								max : 3,
								min: 0,
								step : 1,
								model: this.model
							})
	              ]
	          })]
	      })
	  ]);
	},
	offsetChanged: function(e){
		var input = e.target;
		if(isNaN(parseInt(input.value)) || input.value < 0 || input.value > 3){
			Upfront.Views.Editor.notify('Content padding needs to be an number between 0 and 3.', 'error');
			input.value = 0;
		}
		this.updatePadding();
	},

	updatePadding: function(){
		var left = this.$('input[name=padding_left]').val() || 0,
			right = this.$('input[name=padding_right]').val() || 0
		;
		if(this.for_view)
			this.for_view.trigger('post:padding:update', left, right);
	}
});

var ContentView = PostPartView.extend({
    events : {
        "click .upfront_edit_content_style" : 'start_content_styling'
    },
    start_content_styling : function( e ){
        e.preventDefault();
        e.stopPropagation();
        $(".sidebar-commands-control .command-cancel").show();
        $(e.target).closest(".upfront-module").addClass("upfront-disable-surroundings");
        new PostImageVariants({
            contentView : this
        });
        Upfront.Events.trigger("post:content:style:start", this, 'single');
    },
	updateOptions: function(){
		var properties = this.model.get('properties').toJSON(),
			partOptions = {},
			options = this.postView.partOptions,
			staticProperties = ['', 'row', 'type', 'view_class', 'has_settings', 'id_slug', 'postPart', 'element_id']
		;

		if(_.isArray(options))
			options = {};

		_.each(properties, function(p){
			if(staticProperties.indexOf(p.name) == -1)
				partOptions[p.name] = p.value;
		});

		var left = partOptions.overflow_left || 0,
			right = partOptions.overflow_right || 0
		;

		options[this.postPart] = partOptions;
		options.colSize = Upfront.Behaviors.GridEditor.col_size;

		this.postView.partOptions = options;

		this.updatePartContent();
		this.$('.upfront-object-content').html('Loading');
	},

	render: function(){
		PostPartView.prototype.render.apply(this, arguments);

		if(!this.paddingChangeHandler){
			this.paddingChangeHandler = _.bind(this.refreshPaddings, this);
			this.on('post:padding:update', this.paddingChangeHandler);
		}
		this.refreshPaddingsFromProperties();

        if( Upfront.Application.is_builder() ){
            /**
             * Creates content style button
             * @type {*|HTMLElement}
             */
            var $editor = $('<div class="upfront_edit_content_style">Style Post Content</div>');
            $editor.appendTo( this.$(".upfront-output-PostPart_contents") );
        }

	},

	refreshPaddingsFromProperties: function(){
		this.refreshPaddings((this.property('padding_left') || 0), (this.property('padding_right') || 0));
	},

	refreshPaddings: function(left, right){
		var colSize = Upfront.Behaviors.GridEditor.col_size,
			rightPadding = right * colSize,
			leftPadding = left * colSize,
			styles = $('.upfront-region-postlayouteditor').find('.upfront-post-padding'),
			rules = '.upfront-region-postlayouteditor .upfront-output-PostPart_contents>* {'
		;

		if(!styles.length){
			//Give time to include the layout edition region in the dom
			styles = $('<style class="upfront-post-padding"></style>');
			setTimeout(function(){
				$('.upfront-region-postlayouteditor').append(styles);
			}, 200);
		}

		rules += 'padding-left: ' + leftPadding + 'px; padding-right: ' + rightPadding + 'px;}';

		styles.html(rules);
	}
});

var ImageVariants = new Upfront.Collections.ImageVariants( Upfront.mainData.postImageVariants );

var PostImageVariants =  Backbone.View.extend({
    initialize: function( options ) {
        this.contentView = options.contentView;
        this.populate_style_content();
    },
    events : {
        "click .upfront-add-image-insert-variant" : "add_new_variant"
    },
    add_new_variant : function(){
        var variant = new PostImageVariant();
        variant.render();
        variant.$el.hide();
        $(this).after( variant.el );
        variant.$el.fadeIn();
    },
    populate_style_content : function(){
        var me = this,
            options = this.contentView.postView.partOptions || {},
            request = {
                action: 'content_part_markup',
                post_id: "fake_styled_post",
                parts: JSON.stringify([{slug: this.contentView.postPart, options: options[this.contentView.postPart] || {}}]),
                templates: {}
            };

        request.templates[this.contentView.postPart] = this.contentView.getTemplate();
        var promise = Upfront.Util.post(request);
        promise.done(function(response){
            _.extend(Upfront.Application.PostLayoutEditor.partMarkup, response.data.replacements);
            me.contentView.$el.html(  response.data.replacements["%contents%"] );
            //me.detect_inserts();
            var $page = $('#page');

            $page.find('.upfront-module').draggable('disable').resizable('disable');
            $page.find('.upfront-region-edit-trigger').hide();

            ImageVariants.each(function( model ){
                var variant = new PostImageVariant({ model : model });
                variant.render();
                me.contentView.$el.find("#upfront-image-variants").append( variant.el );
            });
            me.contentView.$el.find("#upfront-image-variants").append("<div class='upfront-add-image-insert-variant'>Add Image Insert Variant</div>")
                .on("click", me.add_new_variant);
        });

        return promise;
    }
});
var PostImageVariant = Backbone.View.extend({
    tpl : _.template($(variant_tpl).find('#upfront-post-image-variant-tpl').html()),
    initialize: function( options ){
        this.opts = options;
        this.model = _.isUndefined(options) || _.isUndefined( options.model ) ? new Upfront.Models.ImageVariant() : options.model;
        //Upfront.Events.on("post:content:style:start", this.populate_style_content);
        console.log(this.model );
        Upfront.Events.on("post:content:style:stop", function(){

        });
    },
    events : {
        "click .upfront_edit_image_insert" : "start_editing",
        "click .finish_editing_image_insert" : "finish_editing"
    },
    render : function() {
        this.$el.html( this.tpl( this.model.toJSON() ) );
        this.$self = this.$(".ueditor-insert-variant");
        this.$image =  this.$(".ueditor-insert-variant-image");
        this.$caption = this.$(".ueditor-insert-variant-caption");
        this.make_resizable();

        return this;
    },
    start_editing : function(e){
        e.preventDefault();
        // Hide edit button
        this.$(".upfront_edit_image_insert").css({
            visibility : "hidden"
        });
        //disable group's resizability
        this.$self.resizable("disable");

        // hide group's resize handles
        this.$self.find(".upfront-icon-control").hide();

        // explicitly set group's height
        this.$self.css("height", this.$(".ueditor-insert-variant").height());

        this.make_items_draggable();
        this.make_items_resizable();
        this.$self.append("<div class='finish_editing_image_insert'>Finish editing image insert</div>")
    },
    finish_editing : function( e ){
        e.preventDefault();
        // Show edit button
        this.$(".upfront_edit_image_insert").css({
            visibility : "visible"
        });
        //enable group's resizability
        this.$self.resizable("enable");

        // Show group's resize handles
        this.$self.find(".upfront-icon-control").show();

        this.$image.draggable("disable");
        this.$image.resizable("disable");
        this.$image.find(".upfront-icon-control").remove();

        this.$caption.draggable("disable");
        this.$caption.resizable("disable");
        this.$caption.find(".upfront-icon-control").remove();

        $(e.target).remove();

    },
    make_items_draggable : function(){
        var options = {
            containment : ".ueditor-insert-variant",
            delay: 50,
            start : function( event, ui ){
              $(this).resizable("disable");
            },
            drag : function( event, ui ){
                //$(this).css({
                //    position : "relative"
                //});
            },
            stop : function(event, ui){
                $(this).resizable("enable");
            }
        };

        /**
         * Make image draggable
         */
        if( _.isEmpty( this.$image.data("uiDraggable") ) ){
            this.$image.draggable( options );
        }else{
            this.$image.draggable( "enable" );
        }

        /**
         * Make caption draggable
         */
        if( _.isEmpty( this.$caption.data("uiDraggable") ) ){
            this.$caption.draggable( options );
        }else{
            this.$caption.draggable( "enable" );
        }
    },
    make_items_resizable : function(){
        var options = {
            containment : ".ueditor-insert-variant",
            handles: {
                nw: '.upfront-resize-handle-nw',
                se: '.upfront-resize-handle-se'
            },
            //autoHide: true,
            delay: 50,
            minHeight: 50,
            minWidth: 45,
            start : function( event, ui ){
                $(this).draggable("disable");
            },
            resize: function( event, ui ){
                //$(this).css({
                //    position : "relative"
                //});
            },
            stop : function(event, ui){
                $(this).draggable("enable");
            }
        };
        /**
         * Make image resizable
         */
        this.$image.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se nosortable" style="display: inline;"></span>');
        this.$image.append('<span class="upfront-icon-control upfront-icon-control-resize-nw upfront-resize-handle-nw ui-resizable-handle ui-resizable-nw nosortable" style="display: inline;"></span>');
        if(_.isEmpty(  this.$image.data("uiResizable") ) ){
            this.$image.resizable(options);
        }else{
            this.$image.resizable("enable");
        }

        /**
         * Make caption resizable
         */
        this.$caption.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se nosortable" style="display: inline;"></span>');
        this.$caption.append('<span class="upfront-icon-control upfront-icon-control-resize-nw upfront-resize-handle-nw ui-resizable-handle ui-resizable-nw nosortable" style="display: inline;"></span>');
        if(_.isEmpty(  this.$caption.data("uiResizable") ) ){
            this.$caption.resizable(options);
        }else{
            this.$caption.resizable("enable");
        }
    },
    make_resizable : function(){
        var self = this,
            ge = Upfront.Behaviors.GridEditor;
        this.$self.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se nosortable" style="display: inline;"></span>');
        this.$self.append('<span class="upfront-icon-control upfront-icon-control-resize-nw upfront-resize-handle-nw ui-resizable-handle ui-resizable-nw nosortable" style="display: inline;"></span>');
        this.$self.resizable({
            autoHide: true,
            delay: 50,
            handles: {
                nw: '.upfront-resize-handle-nw',
                se: '.upfront-resize-handle-se'
            },
            //grid : [Upfront.Behaviors.GridEditor.col_size, Upfront.Behaviors.GridEditor.baseline],
            minHeight: 50,
            minWidth: 45,
            containment: "parent",
            alsoResize: $(this).find('.ueditor-insert-variant-image'),
            resize: function (event, ui) {
                if (ui.position.left ===  0) {
                    $(this).css({
                        float : "left",
                        left : 0
                    });
                } else {
                    $(this).css({
                        float : "none"
                        //right : 0
                    });
                }
            },
            stop: function (event, ui) {
                var $this = $(this),
                    col_class_size = Math.round(ui.size.width / ge.col_size),
                    margin_left = ui.position.left,
                    left_class_size = Math.round(margin_left / ge.col_size),
                    height =  Upfront.Util.height_to_row(ui.size.height) * ge.baseline;

                self.update_class($this, ge.grid.class, col_class_size);
                self.update_class($this, ge.grid.left_margin_class, left_class_size);
                $(this).css({
                    height: height,
                    width: "",
                    left: ""
                });

            }
        });
    },
    update_class :  function ($el, class_name, class_size) {
        var rx = new RegExp('\\b' + class_name + '\\d+');
        if ( ! $el.hasClass( class_name + class_size) ){
            if ( $el.attr('class').match(rx) )
                $el.attr('class', $el.attr('class').replace(rx, class_name + class_size));
            else
                $el.addClass( class_name + class_size );
        }
    }
});
var FeaturedImageView = PostPartView.extend({
	init: function(options){
		this.partOptions = this.postView.partOptions.featured_image || {};
	},
	on_render: function(){
		var me = this,
			moduleId = this.moduleId || this.parent_module_view.model.get_property_value_by_name('element_id'),
			height = this.partOptions.height || 100,
			parentView = this.parent_module_view
		;

		this.moduleId = moduleId;
		this.moduleView = parentView.$('#' + moduleId);

//		console.log(this.model.get('properties').toJSON());

		if(!this.placeholder){
			this.placeholder = $('<div class="upfront-post-thumb-placeholder upfront-ui"><div>Post Featured Image</div></div>');
			if(height)
				this.placeholder.height(height);
		}

		this.$('.upfront-content-marker').replaceWith(this.placeholder);

		if(!height)
			this.resizePlaceholder();

		if(!parentView.$('#style-' + this.cid).length)
			parentView.$el.append('<style id="style-' + this.cid + '">#' + moduleId + ' div{ height: 100%; }</style>');



		//Proxying the callback we can unbind it from the event.
		if(!this.resizePlaceholderCallback)
			this.resizePlaceholderCallback = _.bind(this.resizePlaceholder, this);

		this.moduleView
			.off('resizestop', me.resizePlaceholderCallback)
			.off('resize', me.resizePlaceholderCallback)
			.on('resize', me.resizePlaceholderCallback)
			.on('resizestop', me.resizePlaceholderCallback)
		;
	},
	resizePlaceholder: function(e){
		this.placeholder.height(this.moduleView.height());
		if(e && e.type == 'resizestop') {
			var height = $('.upfront-resize').height();
			this.model.set_property('height', height, true);
			this.model.set_property('attributes', {style: 'max-height: ' + height + 'px' });
			this.partOptions.height = height;
		}
	}
});

var partSettings = {
	date: DateSettings,
	update: UpdateSettings,
    tags : TagSettings,
    contents : ContentSettings
};

var partViews = {
	contents: ContentView,
	featured_image: FeaturedImageView
};


var TemplateEditorField = Upfront.Views.Editor.Field.Field.extend({
	events: {
		'click .upfront-template-edit': 'prepareTemplateEditor'
	},
	render: function(){
		this.$el.html('<a href="#" title="Edit template" class="upfront-css-edit upfront-template-edit">Edit HTML template</a>');
		return this;
	},
	prepareTemplateEditor: function(e){
		e.preventDefault();
		Upfront.Events.trigger('post:edit:templatepart', this.model.tpl, this.model.get_property_value_by_name('postPart'));
	}
});

var TemplateEditor = Backbone.View.extend({
	events: {
		'click button': 'save',
		'click .upfront-css-close': 'cancel'
	},
	initialize: function(){
		var editor = $('#upfront_code-editor'),
			deferred = $.Deferred()
		;

		if(!editor.length){
			editor = $('<section id="upfront_code-editor" class="upfront-ui upfront_code-editor upfront_code-editor-complex upfront-css-no-sidebar"></section>');
		}

		this.setElement(editor);

		this.prepareAce = deferred.promise();

		require(['//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js'], function(){
			deferred.resolve();
		});

		this.editor = editor;
	},

	open: function(options) {
		var me = this;
		me.tpl = options.tpl;
		me.postPart = options.postPart;
		this.prepareAce.then(function(){
			if(me.ace){
				me.ace.getSession().setValue(me.tpl);
				me.$el.show();
			}
			else
				me.render();
		});
	},

	render: function(){
		var me = this,
			resizable = $('<div class="upfront-css-resizable"></div>'),
			editor = this.editor
		;

		editor.detach();

		resizable.html('<div class="upfront-css-top ui-resizable-handle ui-resizable-n"><span class="upfront-css-type">' + this.postPart + ' Part Template</span><a class="upfront-css-close" href="#">close</a></div>');
		resizable.append('<div class="upfront-css-body"><div class="upfront_code-editor-section upfront_code-markup active"><div class="upfront-css-ace"></div></div><button>Save</button></div>');

		this.resizeHandler = this.resizeHandler || function(){
			editor.width($(window).width() - $('#sidebar-ui').width() -1);
		};
		$(window).on('resize', this.resizeHandler);

		this.resizeHandler();

		$('body').append(editor.append(resizable).show());

		var bodyHeight = editor.height() - editor.find('.upfront-css-top').outerHeight();
		editor.find('.upfront-css-body').height(bodyHeight);

		var aceEditor = ace.edit(editor.find('.upfront-css-ace')[0]),
			session = aceEditor.getSession()
		;

		session.setUseWorker(false);
		aceEditor.setShowPrintMargin(false);

		session.setMode("ace/mode/html");
		aceEditor.setTheme('ace/theme/monokai');
		aceEditor.setShowPrintMargin(false);

		session.setValue(this.tpl);

		aceEditor.on('change', function(e){
			if(me.timer)
				clearTimeout(me.timer);
			me.timer = setTimeout(function(){
				console.log('esso');
			},1000);
			me.trigger('change', aceEditor);
		});

		aceEditor.focus();

		this.ace = aceEditor;

		this.startResizable();
	},

	startResizable: function(){
		// Save the fetching inside the resize
		var editor = this.editor,
			me = this,
			$cssbody = editor.find('.upfront-css-body'),
			topHeight = editor.find('.upfront-css-top').outerHeight(),
			$selectors = editor.find('.upfront-css-selectors'),
			$saveform = editor.find('.upfront-css-save-form'),
			onResize = function(e, ui){
				var height = ui ? ui.size.height : editor.find('.upfront-css-resizable').height(),
					bodyHeight = height  - topHeight;
				$cssbody.height(bodyHeight);
				if(me.ace)
					me.ace.resize();
				$selectors.height(bodyHeight - $saveform.outerHeight());
				$('#page').css('padding-bottom', height);
			}
		;
		onResize();
		editor.find('.upfront-css-resizable').resizable({
			handles: {n: '.upfront-css-top'},
			resize: onResize,
			minHeight: 200,
			delay: 100
		});
	},

	save: function(){
		this.trigger('save', this.ace.getSession().getValue(), this.postPart);
	},

	cancel: function(e){
		e.preventDefault();
		this.trigger('cancel');
	},

	close: function(){
		this.postPart = false;
		this.tpl = false;
		this.$el.hide();
	},
	destroy: function(){
		this.ace.destroy();
		this.remove();
	}
});

var PostPartModel = Upfront.Models.ObjectModel.extend({
	initialize: function(props){
		var properties = props.properties;
		if(!properties.element_id)
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');

		this.set('properties', new Upfront.Collections.Properties({}));

		this.init_properties(properties);
		if(typeof this.init == 'function')
			this.init.apply(this, arguments);
	}
});


var SaveDialog = Backbone.View.extend({
	tpl: _.template($(tpls).find('#save-dialog-tpl').html()),
	attributes: {id: 'upfront-save-dialog-background'},
	events: {
		'click #upfront-save-dialog': 'save',
		'click': 'close'
	},
	initialize: function(options){
		this.options = options;
	},
	render: function(){
		if($('#upfront-save-dialog-background').length)
			return;

		this.$el.html(this.tpl(this.options));

		$('body').append(this.$el);

		this.$el
			.width($(window).width())
			.height($(document).height())
		;
		return this;
	},
	save: function(e){
		e.preventDefault();
		var button = $(e.target),
			type
		;
		if(!button.hasClass('upfront-save-button'))
			return;

		this.trigger('save', button.data('save-as'));
	},
	close: function(e){
		if(e && e.isDefaultPrevented())
			return;
		var me = this;
		this.$el.fadeOut('fast', function(){
			me.$el.detach();
			me.trigger('closed');
		});
	},
	save_dialog: function (on_complete, context) {
		$("body").append("<div id='upfront-save-dialog-background' />");
		$("body").append("<div id='upfront-save-dialog' />");
		var $dialog = $("#upfront-save-dialog"),
			$bg = $("#upfront-save-dialog-background"),
			current = Upfront.Application.layout.get("current_layout"),
			html = ''
		;
		$bg
			.width($(window).width())
			.height($(document).height())
		;
		html += '<p>Do you wish to save layout just for this post or apply it to all posts?</p>';
		$.each(_upfront_post_data.layout, function (idx, el) {
			//var checked = el == current ? "checked='checked'" : '';
			//html += '<input type="radio" name="upfront_save_as" id="' + el + '" value="' + el + '" ' + checked + ' />';
			//html += '&nbsp;<label for="' + el + '">' + Upfront.Settings.LayoutEditor.Specificity[idx] + '</label><br />';
			if ( idx == 'type' )
				return;
			html += '<span class="upfront-save-button" data-save-as="' + el + '">' + Upfront.Settings.LayoutEditor.Specificity[idx] + '</span>';
		});
		//html += '<button type="button" id="upfront-save_as">Save</button>';
		//html += '<button type="button" id="upfront-cancel_save">Cancel</button>';
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
			return false;
		});
		$("#upfront-save-dialog-background").on("click", function () {
			$bg.remove(); $dialog.remove();
			return false;
		});
	}
});

Upfront.Views.Editor.SaveDialog = SaveDialog;

//Set Upfront.Content
if(!Upfront.Content)
	Upfront.Content = {};

_.extend(Upfront.Content, {
	PostElement: PostPartElement,
	TemplateEditor: TemplateEditor,
	PostPart: PostPartModel,
    ImageVariants : ImageVariants
});

return {};

//End define
});})(jQuery);
