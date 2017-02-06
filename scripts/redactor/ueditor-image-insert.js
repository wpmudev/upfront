;(function($){
define([
        "scripts/redactor/ueditor-insert",
        "scripts/redactor/ueditor-insert-utils",
        "scripts/redactor/ueditor-image-insert-base",
        'text!scripts/redactor/ueditor-templates.html'
    ],
    function(Insert, utils, base, tpls){


var ImageInsert = base.ImageInsertBase.extend({
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

        var me = this,
            promise = Upfront.Media.Manager.open({multiple_selection: false })
            ;

        promise.done(function(popup, result){
            var imageData = me.getImageData(result);
            imageData.id = me.data.id;
            me.data.clear({silent: true});
            imageData.style =  me.defaultData.style;
            imageData.variant_id = "basic-image";
            me.$editor = $el.closest(".redactor-box");
            me.data.set(imageData);
        });

        return promise;
    },
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
        this.create_controlls( data.style.group.width_cls );

        this.controls.render();
        this.$(".ueditor-insert-variant-group").append(this.controls.$el);
        this.make_caption_editable();
        this.updateControlsPosition();
        this.$(".ueditor-insert-variant-group").append('<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>');

    },

    allow_alignment: function( group_width_cls ){
        if( typeof group_width_cls === "undefined" ) return false;

        var group_width_col = parseInt(group_width_cls.replace("c", ""), 10),
            editor_col = Upfront.Util.grid.width_to_col( this.$editor.width() ) ;

        return ( group_width_col + 2 ) <= editor_col;
    },
    //this function is called automatically by UEditorInsert whenever the controls are created or refreshed
    control_events: function(){
        var me = this;

        /**
         * Image style from variants
         */
        this.listenTo(this.controls, 'control:ok:style', function(view, control){
            if( view._style ){
                this.data.set("variant_id", view.variant_id );
                this.data.set("alignment", view._style );

                view.data.set( "selected", view.variant_id   );
            }
            control.close();
        });

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

        if( !_.isEmpty( ((data || {}).selectedImage || {}).src  ) ) return  data.selectedImage;

        return image;
    },
    //Import from any image tag
    importFromImage: function(image){
        //var imageData = Upfront.Util.clone(this.defaultData),
        image = image instanceof jQuery ? image : $(image);
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
        if( !_.isEmpty( $caption.text() ) ){
            imageData.caption =  $caption.html();
        }
        


        caption_order = $caption.prev( $image_wrapper).length ? 1 : 0;
        imageData.show_caption = $caption.length;
        if(  $group.length ){
            imageData.style = {
                caption: {
                    "order": 1,
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
            if( imageData.variant_id  ){
                imageData.alignment = utils.BasicImageVariants.findWhere( { "vid": $group.data("variant") } );
            }
        }else{
            imageData.alignment = utils.BasicImageVariants.first();
            imageData.variant_id = imageData.alignment.vid;
        }


        var insert = new ImageInsert({data: imageData});


        insert.render();
        var replacee = image.hasClass(".upfront-inserted_image-basic-wrapper") ? image : image.closest(".upfront-inserted_image-basic-wrapper");
        replacee.replaceWith( insert.$el );
        return insert;
    },
    getStyleView: function(){
        if(this.styleView)
            return this.styleView;
        var view = new utils.ImageStylesView( this.data );
        this.styleView = view;
        return view;

    }
});

return {
    ImageInsert: ImageInsert
};

//End Define
});
})(jQuery);
