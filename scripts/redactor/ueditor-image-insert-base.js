;(function($){
    define([
            "scripts/redactor/ueditor-insert",
            'text!scripts/redactor/ueditor-templates.html',
            "scripts/redactor/ueditor-insert-utils"
        ],
        function(Insert, tpls, utils){
            var l10n = Upfront.Settings && Upfront.Settings.l10n
                    ? Upfront.Settings.l10n.global.ueditor
                    : Upfront.mainData.l10n.global.ueditor
                ;
            var ImageInsertBase = Insert.UeditorInsert.extend({
                $editor: false,
                caption_active: false,
                type: 'image',
                className: 'ueditor-insert upfront-inserted_image-wrapper',
                tpl: _.template($(tpls).find('#image-insert-tpl').html()),
                resizable: false,
                defaultData: {
                    insert_type: "image_insert",
                    caption: "Default caption",
                    show_caption: 1,
                    imageFull: {src:'', width:100, height: 100},
                    imageThumb: {src:'', width:100, height: 100},
                    selectedImage: {src:'', width:100, height: 100},
                    linkType: 'do_nothing',
                    linkUrl: '',
                    isLocal: 1,
                    alignment: { vid: "center", label: "Center" },
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
                            "height": 0,
                            "marginRight": 0,
                            "marginLeft": 0
                        },
                        image: {
                            "width_cls": "",
                            "left_cls": "ml0",
                            "top_cls": "mt0",
                            "src": "",
                            "height": 0
                        }
                    }
                },
                wp_defaults: {
                    insert_type: "wp_default",
                    attachment_id: "",
                    caption: "Default caption",
                    link_url: "",
                    image: {
                        src: "",
                        url: "",
                        width: 0,
                        height: 0
                    },
                    style:{
                        wrapper: {
                            alignment: "alignnone",
                            width: "310"
                        },
                        caption: {
                            show: true
                        },
                        image: {
                            size_class: "size-medium"
                        }
                    }
                },
                events:{
                    "click .ueditor-insert-remove": "click_remove",
                    "dragstart img": "on_image_dragstart"
                },
                get_caption_state: function(){
                    if( this.data.get("show_caption")){
                        return 0
                    }else{
                        return 1;
                    }
                },
                click_remove: function( e ){
                    e.preventDefault();
                    this.trigger('remove', this);
                },
                /**
                 * Returns POJO of main model
                 *
                 * @returns {*}
                 */
                get_data_json: function(){
                    return ( typeof this.prepare_data == "function" ? this.prepare_data() : this.data.toJSON() );
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
                            if( self.render_shortcode )
                                self.render_shortcode( self.get_data_json() );

                        })
                        .ueditor({
                            linebreaks: false,
                            autostart: true,
                            pastePlainText: true,
                            buttons: [],
                            placeholder: self.defaultData.caption,
                            inserts:[],
                            focus: false,
                            paragraphize: false
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

                    /**
                     * Manage editability on image insert el events
                     */
                    self.$el.on("hover, click", function(e){
                        e.stopPropagation();
                        var $ed = self.$editor.is(".redactor-editor") ? self.$editor :self.$editor.find('.upfront-object-content'); // select the correct editor
                        $caption.attr("contenteditable", true);
                        $ed.attr("contenteditable", false);
                        self.caption_active = true;
                    });


                    /**
                     * Manage editability on $editor events
                     */
                    this.$editor.on("mouseenter, click", function(e){
                        var $ed = $(this).is(".redactor-editor") ? $(this) :$(this).find('.upfront-object-content'); // select the correct editor
                        $caption.attr("contenteditable", false);
                        $ed.attr("contenteditable", true);
                        self.caption_active = false;
                    });


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
                        var new_state = 1;
                        if( this.data.get("show_caption") )
                            new_state = 0;

                        this.data.set("show_caption", new_state);
                    });

                    this.listenTo(this.controls, 'control:click:change_image', this.change_image);

                    if( typeof this.control_events === "function")
                        this.control_events();
                },

                updateControlsPosition: function(){
                    //var width = Upfront.Util.grid.col_to_width( this.data.get('style').group.width_cls ),
                    //    controls = this.controls.$el,
                    //    margin = 0
                    //    ;
                    //
                    //margin =   ( width - controls.width()  )  / 2;
                    //
                    //controls.css('margin-left', margin + 'px');
                    this.controls.$el.css({
                        left: 15,
                        top:15
                    });
                },

                getSimpleOutput: function () {
                    var out = this.el.cloneNode(true),
                        data = this.data.toJSON()
                        ;

                    data.image = this.get_proper_image();

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
                        imageData = this.is_wp ?  _.extend( {}, this.wp_defaults, {
                            attachment_id: imagePost.ID,
                            caption: imagePost.post_excerpt ?  imagePost.post_excerpt : "" ,
                            link_url: "",
                            image: image,
                            style: {
                                caption:{
                                    show: true
                                },
                                wrapper: {
                                    alignment: "alignnone",
                                    width: image.width
                                },
                                image: {
                                    size_class: 'size-' + image.selected_size
                                }
                            }
                        }) : _.extend({}, this.defaultData, {
                            attachmentId: imagePost.ID,
                            title: imagePost.post_tite,
                            imageFull: imagePost.image,
                            imageThumb: this.getThumb(imagePost.additional_sizes),
                            selectedImage: _.isUndefined( imagePost.selected_size ) ? imagePost.image : _.filter(imagePost.additional_sizes, function( size ){
                                var dimensions = imagePost.selected_size.toLowerCase().split("x"),
                                    width = dimensions[0],
                                    height = dimensions[1];
                                return size.width == width && size.height == height;
                            })[0],
                            linkType: 'do_nothing',
                            linkUrl: '',
                            align: 'center'
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
                    // set default _selected_size
                    imagePost.image.selected_size = 'full';

                    if(imagePost.selected_size == 'full')
                        return imagePost.image;


                    var dimensions = imagePost.selected_size
                            ? imagePost.selected_size.split('x')
                            : [],
                        size_names = ["thumbnail", "medium", "large"]
                        ;
                    if(dimensions.length != 2)
                        return imagePost.image;

                    for(var i = 0; i < imagePost.additional_sizes.length; i++){
                        var size = imagePost.additional_sizes[i];
                        size.selected_size = size_names[i];
                        if(size.width == dimensions[0] && size.height == dimensions[1])
                            return size;
                    }
                    return imagePost.image;
                },

                // Parse the content of the post looking for image insert elements.
                // conentElement: jQuery object representing the post content.
                // insertsData: Insert data stored by the editor.
                importInserts: function(contentElement, insertsData, inserts){
                    var me = this,
                        _inserts = {},
                        inserts_from_shortcode = {}// inserts created from caption shortcode
                        ;

                    if( !contentElement.is(".wp-caption-text") ) this.$editor = contentElement;

                    if( me.importFromShortcode ){
                        inserts_from_shortcode = me.importFromShortcode(contentElement, insertsData, inserts);
                    }

                    var remaining_images =  contentElement.find('img').filter( function() {
                        return !$(this).closest(".ueditor-insert").length;
                    } );

                    _.each(remaining_images, function( img ){
                        var insert = false;

                        insert = me.importFromImage(img);

                        if( insert )
                            _inserts[insert.data.id] = insert;
                    });

                    return _.extend(_inserts, inserts_from_shortcode);
                },

                //Import from image insert wrapper
                importFromWrapper: function(wrapper, insertsData, inserts){
                    var id = wrapper.attr('id'),
                        insert = false,
                        align = false,
                        caption = false,
                        child_class = ImageInsert
                        ;

                    if( _.contains(inserts, "postImage") ){
                        child_class = PostImageInsert;
                    }
                    if(insertsData[id]) {
                        insert = new child_class({data: insertsData[id]});
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

                    var view = new utils.LinkView({data: {linkType: this.data.get('linkType'), linkUrl: this.data.get('linkUrl')}});
                    this.linkView = view;

                    //view.on()
                    return view;
                },

                getStyleView: function(){
                    if(this.styleView)
                        return this.styleView;
                    var view = new utils.PostImageStylesView( this.data );
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
                },
                render_shortcode: function(data){
                    if( this.caption_ueditor && !this.caption_ueditor.options.inserts.length ) return; // if "inserts" array is empty or not defined there is no need to render shortcode!
                    data = data instanceof Backbone.Model ? data.toJSON() : data;

                    var html = this.shortcode_tpl(data);

                    //cleanup new lines and unneeded whitespace
                    html = html.replace( /\[caption[\s\S]+?\[\/caption\]/g, function( a ) {
                        return a.replace( /<br([^>]*)>/g, '<wp-temp-br$1>' ).replace( /[\r\n\t]+/, '' );
                    });

                    html = html.replace( /\s*<div/g, '\n<div' );
                    html = html.replace( /<\/div>\s*/g, '</div>\n' );
                    html = html.replace( /\s*\[caption([^\[]+)\[\/caption\]\s*/gi, '\n\n[caption$1[/caption]\n\n' );
                    html = html.replace( /caption\]\n\n+\[caption/g, 'caption]\n\n[caption' );
                    html = html.replace(/\s+/g," ");
                    this.$shortcode_el.html( html );
                },
                on_image_dragstart: function(e){
                    // disable dragging image
                    e.preventDefault();
                },
                change_image: function(){
                    var self = this;
                    Upfront.Media.Manager.open({
                        multiple_selection: false,
                        insert_options: false,
                        button_text: l10n.change_image,
                        hide_sizes: this.data.get("insert_type") === "image_insert"
                    }).done(function (popup, result) {
                        if(_.isEmpty(  result ) ) return;
                        self.start( result );
                    });
                    return false;
                }
            });


            return {
                ImageInsertBase: ImageInsertBase
            };

//End Define
        });
})(jQuery);
