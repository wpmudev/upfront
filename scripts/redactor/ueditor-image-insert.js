;(function($){
define([
        "scripts/redactor/ueditor-insert",
        'text!scripts/redactor/ueditor-templates.html'
    ],
    function(Insert, tpls){


var ImageInsertBase = Insert.UeditorInsert.extend({
<<<<<<< HEAD
    $editor: false,
    caption_active: false,
    type: 'image',
    className: 'ueditor-insert upfront-inserted_image-wrapper',
=======
    caption_active: false,
    type: 'image',
    className: 'ueditor-insert upfront-inserted_image-wrapper ueditor-insert-variant',
>>>>>>> separate inserts into files
    tpl: _.template($(tpls).find('#image-insert-tpl').html()),
    resizable: false,
    defaultData: {
        caption: "Default caption",
        show_caption: 1,
        imageFull: {src:'', width:100, height: 100},
        imageThumb: {src:'', width:100, height: 100},
<<<<<<< HEAD
        selectedImage: {src:'', width:100, height: 100},
        linkType: 'do_nothing',
        linkUrl: '',
        isLocal: 1,
        alignment: { vid: "center", label: "Center" },
=======
        linkType: 'do_nothing',
        linkUrl: '',
        isLocal: 1,
>>>>>>> separate inserts into files
        externalImage: {
            top: 0,
            left: 0,
            width: 0,
            height: 0
        },
        variant_id : "",
        style: {
            label_id: "",
            vid: "",
            caption: {
<<<<<<< HEAD
                "order": 1,
                "height": 50,
                "width_cls": "",
                "left_cls": "ml0",
                "top_cls": "mt0",
                "show": 1
            },
            group: {
                "float": "none",
                "width_cls": "",
                "left_cls": "ml0",
=======
                "order": 0,
                "height": 50,
                "width_cls": "",
                "left_cls": "",
                "top_cls": "",
                "show": 1
            },
            group: {
                "float": "",
                "width_cls": "",
                "left_cls": "",
>>>>>>> separate inserts into files
                "height": 0,
                "marginRight": 0,
                "marginLeft": 0
            },
            image: {
                "width_cls": "",
<<<<<<< HEAD
                "left_cls": "ml0",
                "top_cls": "mt0",
=======
                "left_cls": "",
                "top_cls": "",
>>>>>>> separate inserts into files
                "src": "",
                "height": 0
            }
        }
    },
    events:{
        "click .ueditor-insert-remove": "click_remove"
    },
    get_caption_state: function(){
        return 1 - parseInt( this.data.get("show_caption"), 10 );
    },
    click_remove: function( e ){
        e.preventDefault();
        this.trigger('remove', this);
    },
    make_caption_editable: function(){
        var self = this,
            data = this.data.get("style"),
            $caption = this.$('.wp-caption-text')
            ;

        if (!data) return false;
        if( !data.caption || !data.caption.show || this.$('.wp-caption-text').length === 0) return;


        //.attr('contenteditable', true)
        $caption.off('keyup')
            .on('keyup', function(e){
                self.data.set('caption', this.innerHTML, {silent: true});
                //Update event makes InsertManager update its data without rendering.
                self.data.trigger('update');
            })
            .ueditor({
                linebreaks: false,
                autostart: true,
                pastePlainText: true,
                buttons: [],
                placeholder: self.defaultData.caption,
                focus: false
            })
            .attr('contenteditable', false)
        ;

        this.caption_ueditor = $caption.data('ueditor');



        /**
         * Saves redactor air changes to the caption model
         */
        this.caption_ueditor.redactor.events.on("ueditor:change", function(e){
            self.data.set('caption', self.caption_ueditor.$el.html(), {silent: true});
            self.data.trigger('update');
        });

        this.caption_ueditor.redactor.events.on('ueditor:focus', function(redactor){
            if( redactor != self.caption_ueditor.redactor || self.caption_active === true)
                return;


            var $parent = self.$el.closest('.redactor-editor'),
                parentUeditor = $parent.data('ueditor'),
                parentRedactor = parentUeditor ? parentUeditor.redactor : false
                ;


            if(!parentRedactor)
                return;

            if( redactor.$element.is( $caption ) ){
                $parent.attr("contenteditable", false);
                $caption.attr("contenteditable", true);
                self.caption_active = true;
            }else{
                $parent.attr("contenteditable", true);
                $caption.attr("contenteditable", false);
                self.caption_active = false;
            }


            parentRedactor.$editor.off('drop.redactor paste.redactor keydown.redactor keyup.redactor focus.redactor blur.redactor');
            parentRedactor.$textarea.on('keydown.redactor-textarea');

        });

        this.caption_ueditor.redactor.events.on('ueditor:blur', function(redactor){
            if( redactor != self.caption_ueditor.redactor ||  self.caption_active === false)
                return;

            var $parent = self.$el.closest('.redactor-editor'),
                parentUeditor = $parent.data('ueditor'),
                parentRedactor = parentUeditor ? parentUeditor.redactor : false
                ;


            if(!parentRedactor)
                return;


            if( redactor.$element.is( $caption ) ){
                $parent.attr("contenteditable", true);
                $caption.attr("contenteditable", false);
                self.caption_active = false;
            }else{
                $parent.attr("contenteditable", false);
                $caption.attr("contenteditable", true);
                self.caption_active = true;
            }

            parentRedactor.build.setEvents();
            //parentRedactor.buildBindKeyboard();

            //var parentUeditor = me.$el.closest('.ueditable').data('ueditor');

        });

        self.$el.on("hover, click", function(e){
            e.stopPropagation();
            var $parent = self.$el.closest('.redactor-editor');
            $caption.attr("contenteditable", true);
            $parent.attr("contenteditable", false);
            self.caption_active = true;
        });


        /**
         * Wait for the parent to get rendered
         */
        setTimeout( function(){
            var $parent = self.$el.closest('.redactor-editor');
            $parent.on("mouseenter, click", function(e){
                $caption.attr("contenteditable", false);
                $parent.attr("contenteditable", true);
                self.caption_active = false;
            });
        }, 10 );

    },
    //this function is called automatically by UEditorInsert whenever the controls are created or refreshed
    controlEvents: function(){
        var me = this;
        this.stopListening(this.controls);

        this.listenTo(this.controls, 'control:ok:link', function(view, control){
            var url = view.$('input[type=text]').val(),
                type = view.$('input[type=radio]:checked').val() || 'do_nothing',
                linkData = {}
                ;
            if ("external" === type && !(url.match(/https?:\/\//) || url.match(/\/\/:/))) {
                // ... check if we want an external URL
                url = url.match(/^www\./) || url.match(/\./)
                    ? 'http://' + url
                    : url
                ;
            }
            linkData = {
                linkType: type,
                linkUrl: url
            };

            this.data.set(linkData);
            view.model.set(linkData);
            control.close();
        });

        /**
         * Toggle Caption
         */
        this.listenTo(this.controls, 'control:click:toggle_caption', function(control){
            this.data.set("show_caption", 1 - parseInt( this.data.get("show_caption"), 10 ) );
        });
<<<<<<< HEAD

        if( typeof this.control_events === "function")
            this.control_events();
=======
>>>>>>> separate inserts into files
    },

    updateControlsPosition: function(){
        var width = this.data.get('width'),
            caption = this.data.get('captionPosition'),
            imageWidth = this.data.get('imageThumb').width,
            controls = this.controls.$el,
            margin = 0
            ;

        if(caption == 'left')
            margin = Math.min(width - imageWidth + (imageWidth / 2) - (controls.width() / 2), width - controls.width());
        else
            margin = Math.max(0, imageWidth / 2 - controls.width() / 2);

        controls.css('margin-left', margin + 'px');
    },

    getSimpleOutput: function () {
        var out = this.el.cloneNode(true),
            data = this.data.toJSON()
            ;

<<<<<<< HEAD
        data.image = this.get_proper_image();
=======
        data.image = data.imageFull;
>>>>>>> separate inserts into files

        this.data.set('width', this.$el.width(), {silent: true});
        this.data.trigger('update');

        data.isLocal = parseInt(data.isLocal, 10);

        out.innerHTML = this.tpl(data);
        $(out).width(this.data.get('width'));
        // return the HTML in a string
        return  $('<div>').html(out).html();
    },
    get_proper_image: function(){
        var data = this.data.toJSON(),
            image = data.imageFull,
            grid = Upfront.Settings.LayoutEditor.Grid
            ;

<<<<<<< HEAD
        
=======
>>>>>>> separate inserts into files
        data.style = data.style || {
            image_col: 0,
            group: '',
            image: '',
            caption: ''
        };

        if( data.imageThumb ){
            if( data.style && data.style.image && data.style.image.col && (data.style.image.col * grid.column_width) <= data.imageThumb.width ){
                image = data.imageThumb;
            }
        }

        return image;
    },
    getOutput: function(){
        var out = this.el.cloneNode(),
            data = this.data.toJSON()
            ;


        data.image = this.get_proper_image();
        if (!data.image) return false;

        this.data.set('width', this.$el.width(), {silent: true});
        this.data.trigger('update');

        data.isLocal = parseInt(data.isLocal, 10);

        out.innerHTML = this.tpl(data);
        //$(out).width(this.data.get('width'));
        // return the HTML in a string
        return  $('<div>').html(out).html();
    },

    //Extract the needed data from the media library result
    getImageData: function(libraryResult){
        if(!libraryResult)
            return false;
        var imagePost = libraryResult.at(0).toJSON(),
            image = this.getSelectedImage(imagePost),
            imageData = $.extend({}, this.defaultData, {
                attachmentId: imagePost.ID,
                title: imagePost.post_tite,
                imageFull: imagePost.image,
                imageThumb: this.getThumb(imagePost.additional_sizes),
<<<<<<< HEAD
                selectedImage: _.isUndefined( imagePost.selected_size ) ? imagePost.image : _.filter(imagePost.additional_sizes, function( size ){
                    var dimensions = imagePost.selected_size.toLowerCase().split("x"),
                        width = dimensions[0],
                        height = dimensions[1];
                    return size.width == width && size.height == height;
                })[0],
                linkType: 'do_nothing',
                linkUrl: '',
                align: 'center'
=======
                linkType: 'do_nothing',
                linkUrl: '',
                align: 'center',
                captionPosition: 'nocaption'
>>>>>>> separate inserts into files
            })
            ;
        return imageData;
    },

    getThumb: function(images){
        var selected = {width: 0};
        _.each(images, function(img){
            if(img.width <= 500 && img.width > selected.width)
                selected = img;
        });
        return selected;
    },

    //Get the image with the selected size
    getSelectedImage: function(imagePost){
        if(imagePost.selected_size == 'full')
            return imagePost.image;

        var dimensions = imagePost.selected_size
                ? imagePost.selected_size.split('x')
                : []
            ;
        if(dimensions.length != 2)
            return imagePost.image;

        for(var i = 0; i < imagePost.additional_sizes.length; i++){
            var size = imagePost.additional_sizes[i];
            if(size.width == dimensions[0] && size.height == dimensions[1])
                return size;
        }
        return imagePost.image;
    },

    // Parse the content of the post looking for image insert elements.
    // conentElement: jQuery object representing the post content.
    // insertsData: Insert data stored by the editor.
    importInserts: function(contentElement, insertsData){
        var me = this,
            images = contentElement.find('img'),
            inserts = {}
            ;
<<<<<<< HEAD

        if( !contentElement.is(".wp-caption-text") ) this.$editor = contentElement;

=======
>>>>>>> separate inserts into files
        images.each(function(){
            var $img = $(this),
                wrapper = $img.closest('.upfront-inserted_image-wrapper'),
                insert = false
                ;

            if(wrapper.length) {
                insert = me.importFromWrapper(wrapper, insertsData);
            } else {
                insert = me.importFromImage($img);
            }
            inserts[insert.data.id] = insert;
        });
        return inserts;
    },

    //Import from image insert wrapper
    importFromWrapper: function(wrapper, insertsData){
        var id = wrapper.attr('id'),
            insert = false,
            align = false,
            caption = false
            ;

        if(insertsData[id]) {
            insert = new ImageInsert({data: insertsData[id]});
        } else {
            insert = this.importFromImage(wrapper.find('img'));
        }
        insert.render();
        wrapper.replaceWith(insert.$el);
        return insert;
    },

    getLinkView: function(){
        if(this.linkView)
            return this.linkView;

        var view = new LinkView({data: {linkType: this.data.get('linkType'), linkUrl: this.data.get('linkUrl')}});
        this.linkView = view;

        //view.on()
        return view;
    },

    getStyleView: function(){
        if(this.styleView)
            return this.styleView;
<<<<<<< HEAD
        var view = new PostImageStylesView( this.data );
=======
        var view = new ImageStylesView( this.data );
>>>>>>> separate inserts into files
        this.styleView = view;
        return view;
    },

    calculateRealSize: function(src){
        var img = new Image();
        img.src = src;

        return {width: img.width, height: img.height};
    },

    generateThumbSrc: function(width, height) {
        var src = this.data.get('imageFull').src,
            parts = src.split('.'),
            extension = parts.pop()
            ;

        src = parts.join('.') + '-' + width + 'x' + height + '.' + extension;
        return src;
    },

<<<<<<< HEAD
=======

>>>>>>> separate inserts into files
    calculateImageResize: function(wrapperSize, imageSize){
        var pivot = imageSize.width / imageSize.height > wrapperSize.width / wrapperSize.height ? 'height' : 'width',
            factor = imageSize[pivot] / wrapperSize[pivot],
            imageData = {
                width: Math.round(imageSize.width / factor),
                height: Math.round(imageSize.height / factor)
            },
            widthPivot = pivot == 'width'
            ;

        imageData.top = widthPivot ? -Math.round((imageData.height - wrapperSize.height) / 2) : 0;
        imageData.left = widthPivot ? 0 : -Math.round((imageData.width - wrapperSize.width) / 2);

        return imageData;
    }

});


<<<<<<< HEAD
var PostImageInsert = ImageInsertBase.extend({
    className: 'ueditor-insert upfront-inserted_image-wrapper ueditor-insert-variant ueditor-post-image-insert',
    tpl: _.template($(tpls).find('#post-image-insert-tpl').html()),
=======
var ImageProInsert = ImageInsertBase.extend({
>>>>>>> separate inserts into files
	//Called just after initialize
	init: function(){
		this.controlsData = [
            {id: 'style', type: 'dialog', icon: 'style', tooltip: 'Style', view: this.getStyleView()},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
		];
		this.createControls();
	},
	// The user want a new insert. Fetch all the required data to create a new image insert
	start: function(){
		var me = this,
			promise = Upfront.Media.Manager.open({multiple_selection: false})
			;

		promise.done(function(popup, result){
			var imageData = me.getImageData(result);
			imageData.id = me.data.id;
			me.data.clear({silent: true});
<<<<<<< HEAD
			imageData.style =  Upfront.Content.ImageVariants.length ?  Upfront.Content.ImageVariants.first().toJSON() : me.defaultData.style;
=======
			imageData.style =  Upfront.Content.ImageVariants.length ?  Upfront.Content.ImageVariants.first().toJSON() : this.defaultData.style;
>>>>>>> separate inserts into files
			imageData.variant_id = imageData.style.vid;
			me.data.set(imageData);

		});

		return promise;
	},
<<<<<<< HEAD
=======
	apply_classes: function (d) {
		if (!d) return false;
		var grid = Upfront.Settings.LayoutEditor.Grid;
		d.height = d.row * grid.baseline;
		d.width_cls = grid.class + d.col;
		d.left_cls = grid.left_margin_class + d.left;
		if ( d.top )
			d.top_cls = grid.top_margin_class + d.top;
		d.clear_cls = d.clear ? 'clr' : '';
	},
>>>>>>> separate inserts into files
	// Insert editor UI
	render: function(){
		var data = _.extend( {}, this.defaultData, this.data.toJSON() ),
			style_variant = data.style;

        if( !style_variant ) return;
		//data.style = style_variant && style_variant.toJSON ? style_variant.toJSON() : {}; // Force this to be POJ object

        data.style.label_id = data.style.label && data.style.label.trim() !== "" ? "ueditor-image-style-" +  data.style.label.toLowerCase().trim().replace(" ", "-") : data.style.vid;
		data.image = this.get_proper_image();

<<<<<<< HEAD
=======

		//this.apply_classes( data.style.group );
		//this.apply_classes( data.style.image );
		//this.apply_classes( data.style.caption );

>>>>>>> separate inserts into files
        if( data.show_caption == 0 ){
            data.style.image.width_cls = Upfront.Settings.LayoutEditor.Grid.class + 24;
        }
        var $group = this.$el.find(".ueditor-insert-variant-group"),
            ge = Upfront.Behaviors.GridEditor,
            $parent = $('.upfront-content-marker-contents'),
            padding_left = parseFloat( $(".upfront-content-marker-contents>*").css("padding-left")) / ge.col_size ,
            padding_right = parseFloat( $(".upfront-content-marker-contents>*").css("padding-right")) / ge.col_size,
            parent_col = Upfront.Util.grid.width_to_col( $parent.width(), true ) ,
            max_col =   parent_col  - padding_left - padding_right,
            col_size = $(".upfront-content-marker-contents>*").width()/max_col
            ;


        padding_left = padding_left ? parseInt(padding_left) : 0;
        padding_right = padding_right ? parseInt(padding_right) : 0;

        if (style_variant && style_variant.group && style_variant.group.float) {
	        if ( style_variant.group.float == 'left' && padding_left > 0 ){
	            data.style.group.marginLeft = ( padding_left - Math.abs(style_variant.group.margin_left) ) * col_size;
	            data.style.group.marginRight = 0;
	        }
	        else if ( style_variant.group.float == 'right' && padding_right > 0 ){
	            data.style.group.marginRight = ( padding_right - Math.abs(style_variant.group.margin_right) ) * col_size;
	            data.style.group.marginLeft = 0;
	        }
	        else if ( style_variant.group.float == 'none' && padding_left > 0 ){
	            data.style.group.marginLeft = ( padding_left - Math.abs(style_variant.group.margin_left) + Math.abs(style_variant.group.left) ) * col_size;
	            data.style.group.marginRight = 0;
	        }
	    }

		this.$el
			.html(this.tpl(data))
		;
		this.createControls();
		this.controls.render();
		this.$(".ueditor-insert-variant-group").append(this.controls.$el);
		this.make_caption_editable();
		this.updateControlsPosition();
		this.$(".ueditor-insert-variant-group").append('<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>');
      
	},

	//this function is called automatically by UEditorInsert whenever the controls are created or refreshed
<<<<<<< HEAD
	control_events: function(){
		var me = this;
=======
	controlEvents: function(){
		var me = this;
		this.stopListening(this.controls);

		this.listenTo(this.controls, 'control:ok:link', function(view, control){
			var url = view.$('input[type=text]').val(),
				type = view.$('input[type=radio]:checked').val() || 'do_nothing',
				linkData = {}
				;
			if ("external" === type && !(url.match(/https?:\/\//) || url.match(/\/\/:/))) {
				// ... check if we want an external URL
				url = url.match(/^www\./) || url.match(/\./)
					? 'http://' + url
					: url
				;
			}
			linkData = {
				linkType: type,
				linkUrl: url
			};

			this.data.set(linkData);
			view.model.set(linkData);
			control.close();
		});


>>>>>>> separate inserts into files
		/**
		* Image style from variants
		*/
        this.listenTo(this.controls, 'control:ok:style', function(view, control){
            if( view._style ){
                var style = view._style.toJSON();
                this.data.set("variant_id", view.variant_id );
                this.data.set("style", view._style.toJSON());
                view.data.set( "selected", view.variant_id   );
            }
            control.close();
        });
<<<<<<< HEAD
=======

        /**
         * Toggle Caption
         */
        this.listenTo(this.controls, 'control:click:toggle_caption', function(control){
            this.data.set("show_caption", 1 - parseInt( this.data.get("show_caption"), 10 ) );
        });
>>>>>>> separate inserts into files
	},

	//Import from any image tag
	importFromImage: function(image){
		//var imageData = Upfront.Util.clone(this.defaultData),
		var imageData = _.extend({}, this.defaultData),
			imageSpecs = {
				src: image.attr('src'),
				width: image.width(),
				height: image.height()
			},
			link = $('<a>').attr('href', imageSpecs.src)[0],
			realSize = this.calculateRealSize(imageSpecs.src),
			$group = image.closest(".ueditor-insert-variant-group"),
			group_classes = $group.attr("class"),
			$caption = $group.find(".wp-caption-text"),
			caption_classes = $caption.attr("class"),
			$image_wrapper = $group.find(".uinsert-image-wrapper"),
			image_wrapper_classes = $image_wrapper.attr("class"),
			caption_order = 1
			;

		if(link.origin != window.location.origin)
			imageData.isLocal = 0;

		this.calculateRealSize(imageSpecs.src);

		imageData.imageThumb = imageSpecs;
		imageData.imageFull = {
			width: realSize.width,
			height: realSize.height,
			src: imageSpecs.src
		};


		var parent = image.parent();

		if(parent.is('a')){
			imageData.linkUrl = parent.attr('href') ;
			imageData.linkType = 'external';
		}

		var attachmentId = image.attr('class');
		if(!attachmentId)
			imageData.attachmentId = false;
		else {
			attachmentId = attachmentId.match(/wp-image-(\d+)/);
			if(attachmentId)
				imageData.attachmentId = attachmentId[1];
			else
				imageData.attachmentId = false;
		}

		imageData.title = image.attr('title');
		imageData.caption = $caption.html();


		caption_order = $caption.prev( $image_wrapper).length ? 1 : 0;

		if(  $group.length ){
			imageData.style = {
				caption: {
					"order": caption_order,
					"height": $caption.css("minHeight") ? $caption.css("minHeight").replace("px", "") : $caption.height(),
					"width_cls": Upfront.Util.grid.derive_column_class( caption_classes ),
					"left_cls": Upfront.Util.grid.derive_marginleft_class( caption_classes ),
					"top_cls": Upfront.Util.grid.derive_margintop_class( caption_classes ),
					"show": $caption.length
				},
				group: {
					"float": $group.css("float"),
					"width_cls": Upfront.Util.grid.derive_column_class( group_classes ),
					"left_cls": Upfront.Util.grid.derive_marginleft_class( group_classes ),
					"height": $group && $group.css("minHeight") ? $group.css("minHeight").replace("px", "") : imageSpecs.height + $caption.height(),
					"marginRight": 0,
					"marginLeft": 0
				},
				image: {
					"width_cls": Upfront.Util.grid.derive_column_class( image_wrapper_classes ),
					"left_cls": Upfront.Util.grid.derive_marginleft_class( image_wrapper_classes ),
					"top_cls": Upfront.Util.grid.derive_margintop_class( image_wrapper_classes ),
					"src": "",
					"height": 0
				}
			};
			imageData.variant_id = $group.data("variant");
		}else{
			imageData.style = Upfront.Content.ImageVariants.first().toJSON();
			imageData.variant_id = imageData.style.vid;
		}


<<<<<<< HEAD
		var insert = new PostImageInsert({data: imageData});
=======
		var insert = new ImageProInsert({data: imageData});
>>>>>>> separate inserts into files

		insert.render();
		image.replaceWith(insert.$el);
		return insert;
	}
});

<<<<<<< HEAD
var BasicImageVariants =  _([
            { vid: "center", label: "Center"  },
            { vid: "left", label: "Left"  },
            { vid: "right", label: "Right"  }
        ]);


var ImageInsert = ImageInsertBase.extend({
    className: 'ueditor-insert upfront-inserted_image-wrapper upfront-inserted_image-basic-wrapper',
    //Called just after initialize
    create_controlls: function(group_width_cls){
        this.controlsData = [
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
        ];

        if( this.allow_alignment( group_width_cls ) )
            this.controlsData.unshift( {id: 'style', type: 'dialog', icon: 'style', tooltip: 'Alignment', view: this.getStyleView()} );

        this.createControls();
    },
    // The user want a new insert. Fetch all the required data to create a new image insert
    start: function( $el ){
=======
var ImageInsert = ImageInsertBase.extend({
    //Called just after initialize
    init: function(){
        this.controlsData = [
            {id: 'style', type: 'dialog', icon: 'style', tooltip: 'Style', view: this.getStyleView()},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
        ];
        this.createControls();
    },
    // The user want a new insert. Fetch all the required data to create a new image insert
    start: function(){
>>>>>>> separate inserts into files
        var me = this,
            promise = Upfront.Media.Manager.open({multiple_selection: false})
            ;

<<<<<<< HEAD

=======
>>>>>>> separate inserts into files
        promise.done(function(popup, result){
            var imageData = me.getImageData(result);
            imageData.id = me.data.id;
            me.data.clear({silent: true});
<<<<<<< HEAD
            imageData.style =  me.defaultData.style;
            imageData.variant_id = "basic-image";
            me.$editor = $el.closest(".redactor-box");
            me.data.set(imageData);
=======
            imageData.style =  Upfront.Content.ImageVariants.length ?  Upfront.Content.ImageVariants.first().toJSON() : this.defaultData.style;
            imageData.variant_id = imageData.style.vid;
            me.data.set(imageData);

>>>>>>> separate inserts into files
        });

        return promise;
    },
<<<<<<< HEAD
    // Insert editor UI
    render: function(){
        var data = _.extend( {}, this.defaultData, this.data.toJSON() ),
            style_variant = data.style,
            alignment = this.data.get("alignment") ;

        if( !style_variant ) return;
        //data.style = style_variant && style_variant.toJSON ? style_variant.toJSON() : {}; // Force this to be POJ object
        data.style.label_id = "ueditor-image-style-center";
        if(  alignment  ){
            data.style.label_id = "ueditor-image-style-" + alignment.vid;
            data.style.group.float = alignment.vid;
        }

        data.image = this.get_proper_image();



        data.style.group.width_cls = this.get_group_width_cls( data.image );
=======
    apply_classes: function (d) {
        if (!d) return false;
        var grid = Upfront.Settings.LayoutEditor.Grid;
        d.height = d.row * grid.baseline;
        d.width_cls = grid.class + d.col;
        d.left_cls = grid.left_margin_class + d.left;
        if ( d.top )
            d.top_cls = grid.top_margin_class + d.top;
        d.clear_cls = d.clear ? 'clr' : '';
    },
    // Insert editor UI
    render: function(){
        var data = _.extend( {}, this.defaultData, this.data.toJSON() ),
            style_variant = data.style;

        if( !style_variant ) return;
        //data.style = style_variant && style_variant.toJSON ? style_variant.toJSON() : {}; // Force this to be POJ object

        data.style.label_id = data.style.label && data.style.label.trim() !== "" ? "ueditor-image-style-" +  data.style.label.toLowerCase().trim().replace(" ", "-") : data.style.vid;
        data.image = this.get_proper_image();


        //this.apply_classes( data.style.group );
        //this.apply_classes( data.style.image );
        //this.apply_classes( data.style.caption );
>>>>>>> separate inserts into files

        if( data.show_caption == 0 ){
            data.style.image.width_cls = Upfront.Settings.LayoutEditor.Grid.class + 24;
        }
        var $group = this.$el.find(".ueditor-insert-variant-group"),
            ge = Upfront.Behaviors.GridEditor,
            $parent = $('.upfront-content-marker-contents'),
            padding_left = parseFloat( $(".upfront-content-marker-contents>*").css("padding-left")) / ge.col_size ,
            padding_right = parseFloat( $(".upfront-content-marker-contents>*").css("padding-right")) / ge.col_size,
            parent_col = Upfront.Util.grid.width_to_col( $parent.width(), true ) ,
            max_col =   parent_col  - padding_left - padding_right,
            col_size = $(".upfront-content-marker-contents>*").width()/max_col
            ;


        padding_left = padding_left ? parseInt(padding_left) : 0;
        padding_right = padding_right ? parseInt(padding_right) : 0;

        if (style_variant && style_variant.group && style_variant.group.float) {
            if ( style_variant.group.float == 'left' && padding_left > 0 ){
                data.style.group.marginLeft = ( padding_left - Math.abs(style_variant.group.margin_left) ) * col_size;
                data.style.group.marginRight = 0;
            }
            else if ( style_variant.group.float == 'right' && padding_right > 0 ){
                data.style.group.marginRight = ( padding_right - Math.abs(style_variant.group.margin_right) ) * col_size;
                data.style.group.marginLeft = 0;
            }
            else if ( style_variant.group.float == 'none' && padding_left > 0 ){
                data.style.group.marginLeft = ( padding_left - Math.abs(style_variant.group.margin_left) + Math.abs(style_variant.group.left) ) * col_size;
                data.style.group.marginRight = 0;
            }
        }

        this.$el
            .html(this.tpl(data))
        ;
<<<<<<< HEAD
        this.create_controlls( data.style.group.width_cls );
=======
        this.createControls();
>>>>>>> separate inserts into files
        this.controls.render();
        this.$(".ueditor-insert-variant-group").append(this.controls.$el);
        this.make_caption_editable();
        this.updateControlsPosition();
        this.$(".ueditor-insert-variant-group").append('<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>');

    },

<<<<<<< HEAD
    allow_alignment: function( group_width_cls ){
        if( typeof group_width_cls === "undefined" ) return false;

        var group_width_col = parseInt(group_width_cls.replace("c", ""), 10),
            editor_col = Upfront.Util.grid.width_to_col( this.$editor.width() ) ;

        return ( group_width_col + 2 ) <= editor_col;
    },
    //this function is called automatically by UEditorInsert whenever the controls are created or refreshed
    control_events: function(){
        var me = this;
=======
    //this function is called automatically by UEditorInsert whenever the controls are created or refreshed
    controlEvents: function(){
        var me = this;
        this.stopListening(this.controls);

        this.listenTo(this.controls, 'control:ok:link', function(view, control){
            var url = view.$('input[type=text]').val(),
                type = view.$('input[type=radio]:checked').val() || 'do_nothing',
                linkData = {}
                ;
            if ("external" === type && !(url.match(/https?:\/\//) || url.match(/\/\/:/))) {
                // ... check if we want an external URL
                url = url.match(/^www\./) || url.match(/\./)
                    ? 'http://' + url
                    : url
                ;
            }
            linkData = {
                linkType: type,
                linkUrl: url
            };

            this.data.set(linkData);
            view.model.set(linkData);
            control.close();
        });

>>>>>>> separate inserts into files

        /**
         * Image style from variants
         */
        this.listenTo(this.controls, 'control:ok:style', function(view, control){
            if( view._style ){
<<<<<<< HEAD
                this.data.set("variant_id", view.variant_id );
                this.data.set("alignment", view._style );
=======
                var style = view._style.toJSON();
                this.data.set("variant_id", view.variant_id );
                this.data.set("style", view._style.toJSON());
>>>>>>> separate inserts into files
                view.data.set( "selected", view.variant_id   );
            }
            control.close();
        });

<<<<<<< HEAD
    },
    get_group_width_cls: function( image ){
        var image_col = Upfront.Util.grid.width_to_col( image.width),
            editor_col = Upfront.Util.grid.width_to_col( this.$editor.width() ) ;

        if( ( image_col + 1 ) <= editor_col ){
            return Upfront.Settings.LayoutEditor.Grid.class + image_col;
        }else{
            return Upfront.Settings.LayoutEditor.Grid.class + editor_col;
        }
    },
    get_proper_image: function(){
        var data = this.data.toJSON(),
            image = data.imageFull,
            grid = Upfront.Settings.LayoutEditor.Grid,
            editor_col = Upfront.Util.grid.width_to_col( this.$editor.width() )
            ;

        if( !_.isEmpty( data.selectedImage.src  ) ) return  data.selectedImage;

        return image;
    },
=======
        /**
         * Toggle Caption
         */
        this.listenTo(this.controls, 'control:click:toggle_caption', function(control){
            this.data.set("show_caption", 1 - parseInt( this.data.get("show_caption"), 10 ) );
        });
    },

>>>>>>> separate inserts into files
    //Import from any image tag
    importFromImage: function(image){
        //var imageData = Upfront.Util.clone(this.defaultData),
        var imageData = _.extend({}, this.defaultData),
            imageSpecs = {
                src: image.attr('src'),
                width: image.width(),
                height: image.height()
            },
            link = $('<a>').attr('href', imageSpecs.src)[0],
            realSize = this.calculateRealSize(imageSpecs.src),
            $group = image.closest(".ueditor-insert-variant-group"),
            group_classes = $group.attr("class"),
            $caption = $group.find(".wp-caption-text"),
            caption_classes = $caption.attr("class"),
            $image_wrapper = $group.find(".uinsert-image-wrapper"),
<<<<<<< HEAD
            image_wrapper_classes = $image_wrapper.attr("class")
=======
            image_wrapper_classes = $image_wrapper.attr("class"),
            caption_order = 1
>>>>>>> separate inserts into files
            ;

        if(link.origin != window.location.origin)
            imageData.isLocal = 0;

<<<<<<< HEAD
=======
        this.calculateRealSize(imageSpecs.src);
>>>>>>> separate inserts into files

        imageData.imageThumb = imageSpecs;
        imageData.imageFull = {
            width: realSize.width,
            height: realSize.height,
            src: imageSpecs.src
        };


        var parent = image.parent();

        if(parent.is('a')){
            imageData.linkUrl = parent.attr('href') ;
            imageData.linkType = 'external';
        }

        var attachmentId = image.attr('class');
        if(!attachmentId)
            imageData.attachmentId = false;
        else {
            attachmentId = attachmentId.match(/wp-image-(\d+)/);
            if(attachmentId)
                imageData.attachmentId = attachmentId[1];
            else
                imageData.attachmentId = false;
        }

        imageData.title = image.attr('title');
        imageData.caption = $caption.html();


        caption_order = $caption.prev( $image_wrapper).length ? 1 : 0;

        if(  $group.length ){
            imageData.style = {
                caption: {
                    "order": caption_order,
                    "height": $caption.css("minHeight") ? $caption.css("minHeight").replace("px", "") : $caption.height(),
                    "width_cls": Upfront.Util.grid.derive_column_class( caption_classes ),
                    "left_cls": Upfront.Util.grid.derive_marginleft_class( caption_classes ),
                    "top_cls": Upfront.Util.grid.derive_margintop_class( caption_classes ),
                    "show": $caption.length
                },
                group: {
                    "float": $group.css("float"),
                    "width_cls": Upfront.Util.grid.derive_column_class( group_classes ),
                    "left_cls": Upfront.Util.grid.derive_marginleft_class( group_classes ),
                    "height": $group && $group.css("minHeight") ? $group.css("minHeight").replace("px", "") : imageSpecs.height + $caption.height(),
                    "marginRight": 0,
                    "marginLeft": 0
                },
                image: {
                    "width_cls": Upfront.Util.grid.derive_column_class( image_wrapper_classes ),
                    "left_cls": Upfront.Util.grid.derive_marginleft_class( image_wrapper_classes ),
                    "top_cls": Upfront.Util.grid.derive_margintop_class( image_wrapper_classes ),
                    "src": "",
                    "height": 0
                }
            };
            imageData.variant_id = $group.data("variant");
<<<<<<< HEAD
            if( imageData.variant_id  ){
                imageData.alignment = BasicImageVariants.findWhere( { "vid": $group.data("variant") } );
            }
        }else{
            imageData.alignment = BasicImageVariants.first();
            imageData.variant_id = imageData.alignment.vid;
        }


        var insert = new ImageInsert({data: imageData});
=======
        }else{
            imageData.style = Upfront.Content.ImageVariants.first().toJSON();
            imageData.variant_id = imageData.style.vid;
        }


        var insert = new ImageProInsert({data: imageData});
>>>>>>> separate inserts into files

        insert.render();
        image.replaceWith(insert.$el);
        return insert;
<<<<<<< HEAD
    },
    getStyleView: function(){
        if(this.styleView)
            return this.styleView;
        var view = new ImageStylesView( this.data );
        this.styleView = view;
        return view;
=======
>>>>>>> separate inserts into files
    }
});
var LinkView = Backbone.View.extend({
		tpl: _.template($(tpls).find('#image-link-tpl').html()),
		initialize: function(opts){
			if(opts.data){
				this.model = new Backbone.Model(opts.data);
				this.listenTo(this.model, 'change', this.render);
			}
		},
		events: {
			'change input[type=radio]': 'updateData'
		},
		render: function(){
			this.$el.width('200px');

			var data = this.model.toJSON();
			data.checked = 'checked="checked"';
			this.$el.html(this.tpl(data));
		},
		updateData: function(e){
			var me = this,
				type = this.$('input:checked').val(),
				url = this.$('#uinsert-image-link-url').val()
			;
			if(type == 'post'){
				var selectorOptions = {postTypes: this.postTypes()};
				Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
					me.model.set({linkType: 'post', linkUrl: post.get('permalink')});
				});
			} else {
				this.model.set({linkType: type, linkUrl: url});
			}
		},
		postTypes: function(){
			var types = [];
			_.each(Upfront.data.ugallery.postTypes, function(type){
				if(type.name != 'attachment')
					types.push({name: type.name, label: type.label});
			});
			return types;
		}
	});
<<<<<<< HEAD
var PostImageStylesView = Backbone.View.extend({
=======
var ImageStylesView = Backbone.View.extend({
>>>>>>> separate inserts into files
    tpl: _.template($(tpls).find('#image-style-tpl').html()),
    initialize: function( options ){
        this.data = new Backbone.Model();
        this.listenTo(this.data, 'change', this.render);
        this.data.set("variants", Upfront.Content.ImageVariants.toJSON());
        this.data.set( "selected", options.get('variant_id') );

    },
    events: {
        'change input[type=radio]': 'update_data',
        'click input[type=radio]': 'on_click'
    },
    render: function(){
        this.$el.html(this.tpl( { data: this.data.toJSON() } ));
        return this;
    },
    on_click: function(e){
        e.stopPropagation();
    },
    update_data: function(e){
        e.stopPropagation();
        this.variant_id = $(e.target).val();
        this._style = Upfront.Content.ImageVariants.findWhere({vid : this.variant_id});
    }
});

<<<<<<< HEAD
var ImageStylesView = Backbone.View.extend({
    tpl: _.template($(tpls).find('#image-style-tpl').html()),
    initialize: function( options ){
        this.data = new Backbone.Model();
        this.listenTo(this.data, 'change', this.render);
        this.data.set("variants", BasicImageVariants.toArray() );
        this.data.set( "selected", options.get('variant_id') ? options.get('variant_id') : "center" );

    },
    events: {
        'change input[type=radio]': 'update_data',
        'click input[type=radio]': 'on_click'
    },
    render: function(){
        this.$el.html(this.tpl( { data: this.data.toJSON() } ));
        return this;
    },
    on_click: function(e){
        e.stopPropagation();
    },
    update_data: function(e){
        e.stopPropagation();
        this.variant_id = $(e.target).val();
        this._style = BasicImageVariants.findWhere({vid : this.variant_id});
    }
});
return {
    PostImageInsert: PostImageInsert,
=======
return {
    ImageProInsert: ImageProInsert,
>>>>>>> separate inserts into files
    ImageInsert: ImageInsert
};

//End Define
});
})(jQuery);
