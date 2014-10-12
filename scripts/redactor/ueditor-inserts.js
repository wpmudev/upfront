;(function($){
define(['text!scripts/redactor/ueditor-templates.html'], function(tpls){

var TYPES = {
	IMAGE: 'image',
    EMBED : 'embed'
}

/*
An insert is a part of a post content that have special functionality and should be stored in
a different way that it is shown.
A shortcode is a good example of insert:
	- It may have settings
	- It is stored as a string with the format [shortcode]
	- It is displayed as html

Insert purpose is let upfront handle this kind of parts of a post content with ease.

*/
var UeditorInsert = Backbone.View.extend({
	shortcodeName: 'ueditor-insert',
	attributes: {contenteditable: 'false'},
   defaultData : {},
   resizable: false,
	initialize: function(opts){
		opts = opts || {};
		var data = opts.data || {};
		data = _.extend({}, this.defaultData, data);
		if(!data.id){
			data.id = 'uinsert-' + (++Upfront.data.ueditor.insertCount);
			//Trigger the insertcount change for updating the server
			Upfront.Events.trigger('content:insertcount:updated');
		}
		this.el.id = data.id;
		this.data = new Backbone.Model(data);
		this.listenTo(this.data, 'change add remove reset', this.render);

		this.createControls();


		if(typeof this.init == 'function')
			this.init();
	},
	start: function(){
		//Dumb start method returning a resolved promise. Override it if async start needed.
		var deferred = $.Deferred();
		deferred.resolve();
		return deferred.promise();
	},
	getOutput: function(){
		var data = this.data.toJSON(),
			shortcode = '[ueditor-insert type="' + this.type + '"'
		;

		_.each(data, function(value, key){
			shortcode += ' ' + key + '="' + value + '"';
		});

		return shortcode + ']';
	},

	importInserts: function(contentElement){
		var me = this,
			regExp = new RegExp('(\[' + this.shortcodeName + '[^\]]*?\])', 'ig'),
			content = contentElement.html(),
			container = $('<div></div>')
		;

		content = content.replace(regExp, '<p class="ueditor-insert">$1</p>');

		var inserts = container.html(content).find('p.ueditor-insert');
		inserts.each(function(){
			var shortcode = me.parseShortcode(this.innerHTML);
			if(shortcode.type && insertObjects[shortcode.type]){

			}
		});

	},
	parseShortcode: function(text){
		var regexp = /\[([^\s\]]+)([^\]]*?)\]/i,
			attrRegExp = /(\w+)\s*=\s*"([^"]*)"(?:\s|$)|(\w+)\s*=\s*\'([^\']*)\'(?:\s|$)|(\w+)\s*=\s*([^\s\'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|(\S+)(?:\s|$)/ig,
			scData = text.match(regexp),
			shortcode = {},
			attrs
		;

		if(!scData)
			return false;

		shortcode.shortcodeName = scData[1];
		attrs = $.trim(scData[2]);
		if(attrs){
			var attrsData = attrs.match(attrRegExp);
			if(attrsData){
				_.each(attrsData, function(attr){
					attr = $.trim(attr);
					var parts = attr.split('=');
					if(parts.length == 1)
						shortcode[attr] = attr;
					else {
						var key = $.trim(parts[0]),
							value = $.trim(parts.slice(1).join('='))
						;
						if(value[0] == '"' && value[value.length -1] == '"' || value[0] == "'" && value[value.length - 1] == "'")
							value = value.slice(1, -1);
						shortcode[key] = value;
					}
				});
			}
		}

		return shortcode;
	},
	createControls: function(){
		var me = this,
			Controls = Upfront.Views.Editor.InlinePanels
		;
		if(this.controls){
			this.controls.remove();
			this.controls = false;
		}

		if(!this.controlsData)
			return;

		this.controls = new Controls.ControlPanel();

		/*
		{
			type: 'simple',
			id: 'controlId',
			icon: 'iconclassname'
			tooltip: 'Awesome tooltip'
		}

		{
			type: 'multi',
			id, icon, tooltip,
			selected: '', // What is the selected item.
			subItems: [...simpleControls...]
		}

		{
			type: 'dialog',
			id, icon, tooltip,
			view: BBView // some Backbone View to be shown inside the tooltip
		}
		 */

		var items = [];
		_.each(this.controlsData, function(controlData){
			var control;
			if(controlData.type == 'simple'){
				control = me.createSimpleControl(controlData);
				me.controls.listenTo(control, 'click', function(){
					me.controls.trigger('control:click', control);
					me.controls.trigger('control:click:' + control.id, control);
				});
			}
			else if(controlData.type == 'multi'){
				control = new Controls.TooltipControl();
				control.selected = controlData.selected;

				if(controlData.subItems){
					var subItems = {};
					_.each(controlData.subItems, function(subItemData){
						subItems[subItemData.id] = me.createSimpleControl(subItemData);
					});
					control.sub_items = subItems;
				}

				me.controls.listenTo(control, 'select', function(item){
					me.controls.trigger('control:select:' + control.id, item);
				});
			}
			else if(controlData.type == 'dialog'){
				control = new Controls.DialogControl();
				control.view = controlData.view;
				me.controls.listenTo(control, 'panel:ok', function(view){
					me.controls.trigger('control:ok:' + control.id, view, control);
				});

				me.controls.listenTo(control, 'panel:open', function(){
					me.controls.$el.addClass('uinsert-control-visible');
					me.$el.addClass('nosortable');
				});
				me.controls.listenTo(control, 'panel:close', function(){
					me.controls.$el.removeClass('uinsert-control-visible');
					me.$el.removeClass('nosortable');
				});
			}

			if(control){
				control.icon = controlData.icon;
				control.tooltip = controlData.tooltip;
				control.id = controlData.id;
				control.label = controlData.label;
				items.push(control);
			}
		});

		this.controls.items = _(items);
		this.controls.render();

		if(typeof this.controlEvents == 'function')
			this.controlEvents();

		this.controls.delegateEvents();
	},

	createSimpleControl: function(controlData){
		var control = new Upfront.Views.Editor.InlinePanels.Control();
		control.icon = controlData.icon;
		control.tooltip = controlData.tooltip;
		control.id = controlData.id;
		control.label = controlData.label;
		return control;
	},

	getAligmnentControlData: function(alignments){
		var types = {
				left: {id: 'left', icon: 'alignleft', tooltip: 'Align left'},
				right: {id: 'right', icon: 'alignright', tooltip: 'Align right'},
				center: {id: 'center', icon: 'aligncenter', tooltip: 'Align center'},
				full: {id: 'full', icon: 'alignfull', tooltip: 'Full width'}
			},
			control = {
				id: 'alignment',
				type: 'multi',
				icon: 'alignment',
				tooltip: 'Alignment',
				subItems: []
			}
		;
		_.each(alignments, function(align){
			if(types[align])
				control.subItems.push(types[align]);
		});
		return control;
	},
	getRemoveControlData: function(){
		return {
			id: 'remove',
			type: 'simple',
			icon: 'remove',
			tooltip: 'Delete'
		};
	},
	resizableInsert: function(){
        if( !this.resizable ) return;
		var me = this,
			align = this.data.get('align'),
			leftControl = true,
			rightControl = true,
			targetSelector = '.upfront-icon-control-resize-se',
			handles = {},
			grid = Upfront.Behaviors.GridEditor
		;


		if(this.$el.hasClass('ui-resizable'))
			this.$el.resizable('destroy');

		if(align == 'left')
			leftControl = false;
		else if(align == 'right'){
			rightControl = false;
			targetSelector = '.upfront-icon-control-resize-sw';
		}

		if(this.$(targetSelector).length){
		}
		else{
			if(rightControl){
				this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se nosortable" style="display: inline;"></span>');
				handles.se = '.upfront-icon-control-resize-se';
			}
			if(leftControl){
				this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-sw upfront-resize-handle-sw ui-resizable-handle ui-resizable-sw nosortable" style="display: inline;"></span>');
				handles.sw = '.upfront-icon-control-resize-sw';
			}
		}

		var resizableOptions = this.getResizableOptions ? this.getResizableOptions() : {};
		resizableOptions.handles = handles;
		resizableOptions.grid = [grid.col_size, grid.baseline];

		this.$el.resizable(resizableOptions);
	}
});


var ImageInsert = UeditorInsert.extend({
    type: 'image',
    className: 'ueditor-insert upfront-inserted_image-wrapper',
    tpl: _.template($(tpls).find('#image-insert-tpl').html()),
    resizable: false,
    defaultData: {
        captionPosition: 'bottom',
        caption: 'Type your caption here ...',
        imageFull: {src:'', width:100, height: 100},
        imageThumb: {src:'', width:100, height: 100},
        linkType: 'do_nothing',
        linkUrl: '',
        isLocal: 1,
        externalImage: {top: 0, left: 0, width: 0, height: 0},
        variant_id : ""
    },
    //Called just after initialize
    init: function(){

        var style_variant = Upfront.Content.ImageVariants.findWhere({ vid : this.data.get("variant_id") }),
            alignControl = this.getAligmnentControlData(['left', 'center', 'full', 'right']);
        alignControl.selected = this.data.get('variant_id');
        this.controlsData = [
            //alignControl,
            {id: 'style',
                type: "multi",
                icon : "style",
                tooltip: "Style",
                selected: this.data.get("variant_id"),
                subItems: this.get_style_control_data()
            },
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            //{id: 'caption',
            //    type: 'multi',
            //    icon: 'caption',
            //    tooltip: 'Caption',
            //    selected: this.data.get('captionPosition') || 'nocaption',
            //    subItems: [
            //        {id: 'nocaption', icon: 'nocaption', tooltip: 'No caption'},
            //        {id: 'left', icon: 'caption-left', tooltip: 'At the left'},
            //        {id: 'bottom', icon: 'caption-bottom', tooltip: 'At the bottom'},
            //        {id: 'right', icon: 'caption-right', tooltip: 'At the right'}
            //    ]
            //},
            this.getRemoveControlData()
        ];
        this.createControls();
        this.data.set("style",  (style_variant ? style_variant : new Upfront.Models.ImageVariant()).toJSON() );
        //if(!this.data.get('width')){
        //    var width = this.data.get('imageThumb').width;
        //    if(['left', 'right'].indexOf(this.data.get('captionPosition')) != -1)
        //        width += 3 * Upfront.Behaviors.GridEditor.col_size;
        //    this.data.set({width: width}, {silent: true});
        //}

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
            imageData.style = ( new Upfront.Models.ImageVariant() ).toJSON();
            me.data.set(imageData);
            me.controlsData[0].selected = me.data.get('align');
            me.createControls();
        });

        return promise;
    },

    // Insert editor UI
    render: function(){
        var me = this,
            data = this.data.toJSON(),
            style_variant = this.data.get("style"),
            wrapperSize = this.data.get('imageThumb');

        data.image = data.imageFull;

        //if(data.align == 'full') {
        //    data.image = data.imageFull;
        //} else {
        //    data.image = data.imageThumb;
        //}
        //
        //var src = this.data.get('imageFull').src;
        //if (!src) {
        //    this.data.set("imageFull", {
        //        height: data.style_variant.get("group").height,
        //        //width: data.width,
        //        src: data.src
        //    });
        //    data.image = this.data.get("imageFull");
        //}
        //data.set("style", )
        //Adapt the caption with the variant style
        //style_variant.caption.text = data.caption;
        //data.caption = style_variant.caption;
        //
        ////Adapt the image with the variant style
        //data.image = _.extend(data.image, style_variant.image);
        //data = _.extend( style_variant, data );
        //console.log("rendering", data);
        this.$el
            .html(this.tpl(data))
        ;

        Upfront.Util.grid.update_class(this.$el, style_variant.group.width_cls);
        this.$el.css({
            float : style_variant.group.float,
            height : style_variant.group.height
        });
        this.controls.render();
        this.$el.append(this.controls.$el);
        this.make_caption_editable();
        this.updateControlsPosition();

        this.$('.uinsert-image-wrapper')
            //.css(wrapperData)
            .find('img')
            .attr('src', this.data.get("imageFull").src)
            //.css({
            //    position: 'absolute',
            //    'max-width': 'none',
            //    'max-height': 'none'
            //})
            //.css(imageSize)
        ;

        if(!this.data.get('isLocal'))
            this.data.set({externalImage: style_variant.image.width}, {silent: true});
    },

    make_caption_editable: function(){
        var me = this;
        if( !this.data.get("style").caption.show ) return;
            this.$('.wp-caption-text')
                //.attr('contenteditable', true)
                .off('keyup')
                .on('keyup', function(e){
                    me.data.set('caption', this.innerHTML, {silent: true});
                    //Update event makes InsertManager update its data without rendering.
                    me.data.trigger('update');
                })
                .ueditor({
                    linebreaks: true,
                    autostart: true,
                    pastePlainText: true,
                    airButtons: ['bold', 'italic', 'upfrontLink', 'stateAlign']
                })
            ;
            this.ueditor = this.$('.wp-caption-text').data('ueditor');
            this.ueditor.redactor.events.on('ueditor:focus', function(redactor){
                if(redactor != me.ueditor.redactor)
                    return;

                var parentUeditor = me.$el.closest('.upfront-content-marker-contents').data('ueditor'),
                    parentRedactor = parentUeditor ? parentUeditor.redactor : false
                    ;

                if(!parentRedactor)
                    return;

                parentRedactor.$editor.off('drop.redactor paste.redactor keydown.redactor keyup.redactor focus.redactor blur.redactor');
                parentRedactor.$source.on('keydown.redactor-textarea');

                //parentUeditor.stop();
            });

            this.ueditor.redactor.events.on('ueditor:blur', function(redactor){
                if(redactor != me.ueditor.redactor)
                    return;

                var parentUeditor = me.$el.closest('.upfront-content-marker-contents').data('ueditor'),
                    parentRedactor = parentUeditor ? parentUeditor.redactor : false
                    ;

                if(!parentRedactor)
                    return;

                parentRedactor.buildBindKeyboard();

                //var parentUeditor = me.$el.closest('.ueditable').data('ueditor');
                //parentUeditor.start();
            });
    },
    //this function is called automatically by UEditorInsert whenever the controls are created or refreshed
    controlEvents: function(){
        var me = this;
        this.stopListening(this.controls);
        this.listenTo(this.controls, 'control:click:remove', function(control){
            this.trigger('remove', this);
        });


        this.listenTo(this.controls, 'control:select:alignment', function(control){
            var alignData = {
                    align: control
                },
                colSize = Upfront.Behaviors.GridEditor.col_size,
                thumb = this.data.get('imageThumb'),
                captionPosition = this.data.get('captionPosition'),
                sideCaption = captionPosition == 'left' || captionPosition == 'right',
                width
                ;
            if(control == 'full'){
                this.data.set(alignData);
                alignData.width = me.$el.width();

                if(sideCaption)
                    thumb.width = (alignData.width / colSize - 3) * colSize;
                else
                    thumb.width = alignData.width;

                thumb.width = Math.round(thumb.width);

                thumb.src = this.data.get('isLocal') ? this.generateThumbSrc(thumb.width, thumb.height) : thumb.src;
                alignData.thumb = thumb;
            }

            else if(this.data.get('align') == 'full') {
                width = Math.round((this.data.get('width') / colSize - 6) * colSize);
                alignData.width = width;

                if(sideCaption)
                    thumb.width = width - 3 * colSize;
                else
                    thumb.width = width;

                thumb.width = Math.round(thumb.width);

                thumb.src = this.data.get('isLocal') ? this.generateThumbSrc(thumb.width, thumb.height) : thumb.src;
                alignData.thumb = thumb;
            }
            this.data.set(alignData);
        });

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

        this.listenTo(this.controls, 'control:select:caption', function(captionPosition){
            var currentPosition = this.data.get('captionPosition'),
                newData = {captionPosition: captionPosition},
                isCurrentSide = ['left', 'right'].indexOf(this.data.get('captionPosition')) != -1,
                isPositionSide = ['left', 'right'].indexOf(captionPosition) != -1,
                align = this.data.get('align'),
                thumb = this.data.get('imageThumb'),
                colSize = Upfront.Behaviors.GridEditor.col_size
                ;

            if(isCurrentSide != isPositionSide){
                if(align == 'full'){
                    thumb.width = isPositionSide ? (this.data.get('width') / colSize - 3) * colSize : this.data.get('width');
                    thumb.width = Math.round(thumb.width);
                    thumb.src = this.data.get('isLocal') ? this.generateThumbSrc(thumb.width, thumb.height) : thumb.src;
                    newData.imageThumb = thumb;
                }
                else
                    newData.width = isPositionSide ? parseInt(this.data.get('imageThumb').width, 10) + 3 * colSize : parseInt(this.data.get('imageThumb').width, 10);
            }

            this.data.set(newData);
        });
        /**
         * Image style from variants
         */
        this.listenTo(this.controls, 'control:select:style', function(variant_id){
            var _style = Upfront.Content.ImageVariants.findWhere({vid : variant_id});
            if( _style ){
                var style = _style.toJSON();
                this.data.set("variant_id", variant_id );
                this.data.set("style", _style.toJSON());
            }
        });
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
        var out = this.el.cloneNode(),
            data = this.data.toJSON()
            ;

        data.image = data.imageFull;

        this.data.set('width', this.$el.width(), {silent: true});
        this.data.trigger('update');

        data.isLocal = parseInt(data.isLocal, 10);

        out.innerHTML = this.tpl(data);
        $(out).width(this.data.get('width'));
        // return the HTML in a string
        return  $('<div>').html(out).html();
    },

    getOutput: function(){
        var out = this.el.cloneNode(),
            data = this.data.toJSON()
            ;

        data.image = data.imageThumb;

        this.data.set('width', this.$el.width(), {silent: true});
        this.data.trigger('update');

        data.isLocal = parseInt(data.isLocal, 10);

        out.innerHTML = this.tpl(data);
        $(out).width(this.data.get('width'));
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
                linkType: 'do_nothing',
                linkUrl: '',
                align: 'center',
                captionPosition: 'nocaption'
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
            align = wrapper.css('float');
            if(align != 'none')
                insert.data.set('align', align);

            caption = wrapper.find('.wp-caption-text');
            if(caption.length){
                insert.data.set('caption', caption.html());
                if(wrapper.hasClass('uinsert-caption-left'))
                    insert.data.set('captionPosition', 'left');
                else if(wrapper.hasClass('uinsert-caption-right'))
                    insert.data.set('captionPosition', 'right');
                else
                    insert.data.set('captionPosition', 'bottom');
            }

        }
        insert.render();
        wrapper.replaceWith(insert.$el);
        return insert;
    },

    //Import from any image tag
    importFromImage: function(image){
        var imageData = this.defaultData,
            imageSpecs = {
                src: image.attr('src'),
                width: image.width(),
                height: image.height()
            },
            link = $('<a>').attr('href', imageSpecs.src)[0],
            realSize = this.calculateRealSize(imageSpecs.src)
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

        var align = 'center';
        if(image.hasClass('aligncenter'))
            align = 'center';
        else if(image.hasClass('alignleft'))
            align = 'left';
        else if(image.hasClass('alignright'))
            align = 'right';

        imageData.align = align;

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
        var insert = new ImageInsert({data: imageData});

        insert.render();
        image.replaceWith(insert.$el);
        return insert;
    },

    getLinkView: function(){
        if(this.linkView)
            return linkView;

        var view = new LinkView({data: {linkType: this.data.get('linkType'), linkUrl: this.data.get('linkUrl')}});
        this.linkView = view;

        //view.on()
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

    resizableImage: function(){
        return;
        var me = this,
            captionPosition = this.data.get('captionPosition'),
            handles = {w: '.upfront-resize-handle-w'},
            h = 'w',
            colSize = Upfront.Behaviors.GridEditor.col_size
            ;
        if(captionPosition == 'right'){
            handles = {e: '.upfront-resize-handle-e'};
            h = 'e';
        }

        this.$('.uinsert-image-wrapper')
            .append('<span class="upfront-icon-control upfront-icon-control-resize-' + h + ' upfront-resize-handle-' + h + ' ui-resizable-handle ui-resizable-' + h + ' nosortable" style="display: inline;"></span>')
            .resizable({
                handles:handles,
                start: function(e){
                    var insertWidth = me.$el.width();
                    me.onStartResizing();
                    me.$el.width(me.$el.width());
                    $(this).resizable('option', {
                        maxWidth:  insertWidth - 2 * colSize,
                        minWidth: 2 * colSize
                    });
                },
                resize: function(e, ui){
                    var wrapper = me.resizeCache.wrapper;
                    //refresh image dimensions and position
                    var imageData = me.calculateImageResize({width: wrapper.width(), height: wrapper.height()}, me.resizeCache.imagedata);
                    me.resizeCache.image.css(imageData);
                    $(this).css({left: 0});
                },
                stop: function(e, ui){
                    me.onStopResizing();
                },
                grid: [colSize, Upfront.Behaviors.GridEditor.baseline]
            })
        ;

    },
    get_style_control_data : function(){
        return  Upfront.Content.ImageVariants.map(function( variant, index ){
            return {
                id: variant.get("vid"),
                label: variant.get("label")
            }
        });
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
/*
var EmbedInsert = UeditorInsert.extend({
        type: 'embed',
        className: 'ueditor-insert upfront-inserted_embed-wrapper uinsert-drag-handle',
        tpl: _.template($(tpls).find('#embed-insert-tpl').html()),
        defaultData : {
            code : " "
        },
        //Called just after initialize
        init: function(){
        		var align = this.getAligmnentControlData(['left', 'center', 'full', 'right']);
            align.selected = this.data.get('align') || 'center',

            this.controlsData = [
            	align,
               {id: 'code', type: 'dialog', icon: 'embed', tooltip: 'Change code', view: this.getFormView()},
               this.getRemoveControlData()
            ];

            //this.createControls();
        },

        // Insert editor UI
        render: function(){
            var data = this.data.toJSON();
            this.$el
                .html(this.tpl(data))
                .removeClass('aligncenter alignleft alignright alignfull')
                .addClass('align' + this.data.get('align'))
            ;

            this.controls.render();
            this.$el.append(this.controls.$el);
        },

        //this function is called automatically by UEditorInsert whenever the controls are created or refreshed
        controlEvents: function(){
            this.stopListening(this.controls);
            this.listenTo(this.controls, 'control:click:remove', function(control){
                this.trigger('remove', this);
            });

            this.listenTo(this.controls, 'control:select:alignment', function(control){
                this.data.set('align', control);
            });
            this.listenTo(this.controls, 'control:ok:code', function(view, control){
                var data = {
                    code: view.$('textarea').val()
                };
                this.data.set(data);
                control.close();
            });
        },
        start: function(){
            //Dumb start method returning a resolved promise. Override it if async start needed.
            var deferred = $.Deferred();
            deferred.resolve();
            this.onStartActions();
            return deferred.promise();
        },
        onStartActions : function() {
            var self = this;

            //Show the embed form after clicking on embed element
            this.controls.$el.show(function(){
                self.controls.$el.find(".upfront-icon-region-embed").next(".uimage-control-panel").show();
                self.controls.$el.find(".upfront-icon-region-embed").click();
                self.controls.$el.find(".upfront-field-embed_code").focus();
            });
        },
        // Returns output for the element to inserted into the dome
        // @returns html
	getOutput: function(){
		var out = this.el.cloneNode(),
			data = this.data.toJSON()
		;

		out.innerHTML = this.tpl(data);
		// return the HTML in a string
		return  $('<div>').html(out).html();
	},


    // Parse the content of the post looking for embed insert elements.
    importInserts: function(contentElement, insertsData){
        var me = this,
            codes = contentElement.find('.upfront-inserted_embed-wrapper'),
            inserts = {}
            ;
        codes.each(function(){
            var $code = $(this),
                insert = false
                ;

            if($code.length)
                insert = me.importFromWrapper($(this), insertsData);
            else
                insert = EmbedInsert({data: "Default data"});

            inserts[insert.data.id] = insert;
        });

        return inserts;
    },
    //Import from embed insert wrapper
    importFromWrapper: function(wrapper, insertsData){
        var id = wrapper.attr('id'),
            insert = false,
            align = false
            ;
        insert = new EmbedInsert({data: insertsData[id]});
        insert.render();
        wrapper.replaceWith(insert.$el);
        return insert;
    },

     getFormView: function(){
         if(this.formView)
             return this.formView;

         var view = new EmbedFormView({data: {code: this.data.get('code')}});
         this.formView = view;

         view.on();
         return view;
     }
});

var EmbedFormView = Backbone.View.extend({
    tpl: _.template($(tpls).find('#embed-insert-form-tpl').html()),
    initialize: function(opts){
        if(opts.data){
            this.model = new Backbone.Model(opts.data);
            this.listenTo(this.model, 'change', this.render);
        }
    },
    events: {
        //'change input[type=radio]': 'updateData'
    },
    render: function(){
        this.$el.width('400px');
        var data = this.model.toJSON();
        this.$el.html(this.tpl(data));
    }
});
*/

var EmbedInsert = UeditorInsert.extend({
    type: 'embed',
    className: 'ueditor-insert upfront-inserted_embed-wrapper uinsert-drag-handle',

    defaultData: {
    	code: ''
    },

    start: function () {
		var me = this,
			manager = new EmbedManager({code: this.data.get("code")}),
			deferred = new $.Deferred()
		;
		manager.on("done", function (embed) {
			me.data.set({code: embed});
			manager.remove();
			deferred.resolve(this, embed);
		});
		Upfront.Events.on("upfront:element:edit:stop", function () {
			manager.remove();
			deferred.resolve();
		});
		return deferred;
    },

    render: function () {
    	var me = this,
    		code = this.data.get("code"),
    		$code = $("<div />").append(code)
    	;
    	this.$el.empty();
    	if (!code) return;
    	$code.append('<div class="upfront-edit_insert">edit</div>');
    	this.$el.append(
			$("<div />").append($code).html()
    	);

    	this.$el
    		.off("click", ".upfront-edit_insert")
    		.on("click", ".upfront-edit_insert", function (e) {
		    	e.preventDefault();
		    	e.stopPropagation();
    			me.start();
    		})
    	;
    },

    getOutput: function () { return this._get_output(); },
    getSimpleOutput: function () { return this._get_output(); },

    _get_output: function () {
    	var $out = $("<div />").append('<div class="upfront-inserted_embed">' + this.data.get("code") + '</div>');
    	return $out.html();
    },

    importInserts: function(contentElement, insertsData){
    	var inserts = {};
    	contentElement.find('.upfront-inserted_embed').each(function () {
    		var $code = $(this),
    			insert = new EmbedInsert({data: {code: $code.html()}})
    		;
    		inserts[insert.data.id] = insert;
    		insert.render();
        	$code.replaceWith(insert.$el);
    	});
        return inserts;
    },
});

var EmbedManager = Backbone.View.extend({
	className: "upfront-inserts-markup-editor",
	initialize: function (opts) {
		var me = this,
			code = opts && opts.code ? opts.code : ''
		;
		require([
			'//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js'
		], function () {
			me.render(code);
		});
	},
	render: function (code) {
		var me = this,
			main = new EmbedViews.Main({code: code}),
			bar = new EmbedViews.Bar(),
			ok = new EmbedViews.OK()
		;
		main.render();
		bar.render();
		ok.render();
		this.$el
			.empty()
			.append(bar.$el)
			.append(ok.$el)
			.append(main.$el)
		;

		$("body").append(this.$el);
		main.boot_editor();

		bar.on("insert", function (stuff) {
			main.insert(stuff);
		});
		ok.on("done", function () {
			var value = main.get_value();
			me.trigger("done", value);
		});
	}
});

var EmbedViews = {
	l10n: Upfront.Settings.l10n.markup_embeds,

	OK: Backbone.View.extend({
		className: 'upfront-inserts-markup-apply',
		events: { click: 'propagate_apply' },
		propagate_apply: function (e) { 
			e.stopPropagation(); 
			this.trigger("done");
		},
		render: function () {
			this.$el.empty().append(
				'<a href="#">' + EmbedViews.l10n.done + '</a>'
			);
		}
	}),

	Bar: Backbone.View.extend({
		className: 'upfront-inserts-markup-bar',
		events: { 
			click: 'stop_prop',
			'click .inserts-shortcode': 'request_shortcode',
			'click .inserts-image': 'request_image',
		},
		stop_prop: function (e) { e.stopPropagation(); },
		render: function () {
			this.$el.empty().append(
				'<ul>' +
					'<li><a href="#" class="inserts-shortcode">' + EmbedViews.l10n.insert_shortcode + '</a></li>' +
					'<li><a href="#" class="inserts-image">' + EmbedViews.l10n.insert_image + '</a></li>' +
				'</ul>'
			);
		},
		request_shortcode: function (e) {
			e.stopPropagation();
			e.preventDefault();
			var me = this;
			Upfront.Popup.open(function () {
				var me = this,
					shortcode = new EmbedViews.ShortcodesList()
				;
				shortcode.render();
				shortcode.on("done", function (code) {
					Upfront.Popup.close(code);
				});
				$(this).empty().append(shortcode.$el);
			}, {}, 'embed-shortcode').done(function (pop, code) {
				me.trigger("insert", code);
			});
		},
		request_image: function (e) {
			e.stopPropagation();
			e.preventDefault();
			var me = this;
			Upfront.Media.Manager.open({
				multiple_selection: false,
				media_type: ["images"]
			}).done(function (pop, result) {
				if(!result) return;
				var imageModel = result.models[0],
					url = imageModel.get('image').src
				;
				url = url.replace(document.location.origin, '');
				me.trigger("insert", url);
			});
		}
	}),

	Main: Backbone.View.extend({
		className: 'upfront-embed_editor',
		events: { click: 'stop_prop' },
		code: '',
		initialize: function (opts) {
			if (opts && opts.code) this.code = opts.code;
		},
		stop_prop: function (e) { e.stopPropagation(); },
		render: function () {
			this.$el.empty()
				.append(
					'<div class="upfront-inserts-markup active">' +
						'<div class="upfront-inserts-ace"></div>' +
					'</div>'
				)
				.show()
			;
		},
		boot_editor: function () {
			var $editor_outer = this.$el,
				$editor = $editor_outer.find('.upfront-inserts-ace')
			;
			var html = $editor.html(),
				editor = ace.edit($editor.get(0)),
				syntax = $editor.data('type')
			;
			editor.getSession().setUseWorker(false);
			editor.setTheme("ace/theme/monokai");
			editor.getSession().setMode("ace/mode/html");
			editor.setShowPrintMargin(false);
			editor.getSession().setValue(this.code);

			editor.renderer.scrollBar.width = 5;
			editor.renderer.scroller.style.right = "5px";

			$editor.height($editor_outer.height());
			editor.resize();

			editor.focus();

			this.editor = editor;
		},
		insert: function (stuff) {
			this.editor.insert(stuff);
		},
		get_value: function () {
			return this.editor.getValue();
		}
	}),

	ShortcodesList: Backbone.View.extend({
		events: { click: 'stop_prop' },
		stop_prop: function (e) { e.stopPropagation(); },
		render: function () {
			var me = this;
			this.$el.empty().append(EmbedViews.l10n.waiting);
			Upfront.Util.post({action: "upfront_list_shortcodes"}).done(function (response) {
				me.$el
					.empty()
					.append('<div class="shortcode-types" />')
					.append('<div class="shortcode-list" />')
				;
				me.render_types(response.data);
				me.render_list();
			});
		},
		render_types: function (types) {
			var me = this,
				values = [{label: EmbedViews.l10n.select_area, value: 0}],
				$root = this.$el.find(".shortcode-types")
			;
			_.each(_.keys(types), function (key) {
				values.push({label: key, value: key});
			});
			var selection = new Upfront.Views.Editor.Field.Select({
				label: '',
				name: "shortcode-selection",
				width: '100%',
				values: values,
				multiple: false,
				change: function(){
					var key = this.get_value();
					if (!(key in types)) return false;
					me.render_list(types[key]);
				}
			});
			selection.render();
			$root.empty().append(selection.$el);
		},
		render_list: function (shortcodes) {
			var me = this,
				$root = this.$el.find(".shortcode-list")
			;
			$root.empty();
			if (empty(shortcodes)) return false;
			_.each(shortcodes, function (code) {
				var code = new EmbedViews.Shortcode({code: code});
				code.render();
				code.on("done", function (code) {
					me.trigger("done", code);
				});
				$root.append(code.$el);
			});
		}
	}),

	Shortcode: Backbone.View.extend({
		tagName: 'pre',
		events: { click: 'send_shortcode' },
		initialize: function (opts) {
			this.code = opts.code;
		},
		send_shortcode: function (e) { 
			e.stopPropagation(); 
			e.preventDefault();
			if (!this.code) return false;
			this.trigger("done", '[' + this.code + ']');
		},
		render: function () {
			this.$el.empty().append('<code>[' + this.code + ']</code>');
		}
	})
};

var insertObjects = {};
insertObjects[TYPES.IMAGE] = ImageInsert;
insertObjects[TYPES.EMBED] = EmbedInsert;

return {
	UeditorInsert: UeditorInsert,
	inserts: insertObjects,
	TYPES: TYPES
}

//End Define
});})(jQuery);