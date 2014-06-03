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
		console.log('insert');

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
	}
});

var ImageInsert = UeditorInsert.extend({
	type: 'image',
	className: 'ueditor-insert upfront-inserted_image-wrapper',
	tpl: _.template($(tpls).find('#image-insert-tpl').html()),
	defaultData: {
		captionPosition: 'nocaption',
		caption: 'A wonderful image :)',
		imageFull: {src:'', width:100, height: 100},
		imageThumb: {src:'', width:100, height: 100}
	},
	//Called just after initialize
	init: function(){
		var alignControl = this.getAligmnentControlData(['left', 'center', 'full', 'right']);
		alignControl.selected = this.data.get('align');
		this.controlsData = [
			alignControl,
			{id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
			{id: 'caption',
				type: 'multi',
				icon: 'caption',
				tooltip: 'Caption',
				selected: this.data.get('captionPosition') || 'nocaption',
				subItems: [
					{id: 'nocaption', icon: 'nocaption', tooltip: 'No caption'},
					{id: 'left', icon: 'caption-left', tooltip: 'At the left'},
					{id: 'bottom', icon: 'caption-bottom', tooltip: 'At the bottom'},
					{id: 'right', icon: 'caption-right', tooltip: 'At the right'}
				]
			},
			this.getRemoveControlData()
		];
		this.createControls();
	},

	// The user want a new insert. Fetch all the required data to create a new image insert
	start: function(){
		var me = this,
			promise = Upfront.Media.Manager.open()
		;

		promise.done(function(popup, result){
			var imageData = me.getImageData(result);
			imageData.id = me.data.id;
			me.data.clear({silent: true});
            console.log(imageData);
			me.data.set(imageData);
			me.controlsData[0].selected = me.data.get('align');
			me.createControls();
		});

		return promise;
	},

	// Insert editor UI
	render: function(){
		var me = this,
			data = this.data.toJSON()
		;

		if(data.align == 'full') {
			if (data.imageFull && data.imageFull.src) data.image = data.imageFull;
		} else {
			if (data.imageThumb && data.imageThumb.src) {
				data.image = data.imageThumb;
			} else {
				data.image = $.extend({}, data.imageThumb, {
					src: data.src,
					height: data.height,
					width: data.width
				});
			}
		}
		// Make sure we have *a* caption
		data.caption = data.caption || this.defaultData.caption;

		console.log(data);
		if(data.captionPosition == 'left' || data.captionPosition == 'right') {
			this.$el.css({
				'min-width': (parseInt(data.image.width, 10) + 100) + 'px',
				'max-width': (2* parseInt(data.image.width, 10)) + 'px'
			});
		} else {
			this.$el.css({
				'min-width': 'auto',
				'max-width': 'auto'
			});
		}

		this.$el
			.html(this.tpl(data))
			.removeClass('aligncenter alignleft alignright alignfull')
			.addClass('align' + this.data.get('align'))
		;

		this.controls.render();
		this.$el.append(this.controls.$el);

		this.captionTimer = false;

		this.$('.wp-caption-text')
			.attr('contenteditable', true)
			.addClass('nosortable')
			.off('keyup')
			.on('keyup', function(e){
				me.data.set('caption', this.innerHTML, {silent: true});
				//Update event makes InsertManager update its data without rendering.
				me.data.trigger('update');
			})
		;
	},

	//this function is called automatically by UEditorInsert whenever the controls are created or refreshed
	controlEvents: function(){
		this.stopListening(this.controls);
		this.listenTo(this.controls, 'control:click:remove', function(control){
			console.log(control);
			this.trigger('remove', this);
		});

		this.listenTo(this.controls, 'control:select:alignment', function(control){
			this.data.set('align', control);
		});

		this.listenTo(this.controls, 'control:ok:link', function(view, control){
			var linkData = {
				linkType: view.$('input[type=radio]:checked').val() || 'do_nothing',
				linkUrl: view.$('input[type=text]').val()
			};

			this.data.set(linkData);
			control.close();
		});

		this.listenTo(this.controls, 'control:select:caption', function(captionPosition){
			this.data.set({captionPosition: captionPosition});
		});
	},

	getOutput: function(){
		var out = this.el.cloneNode(),
			data = this.data.toJSON()
		;
		if(data.align == 'full')
			data.image = data.imageFull;
		else
			data.image = data.imageThumb;

		this.data.set('width', this.$el.width(), {silent: true});
		this.data.trigger('update');

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

		var dimensions = imagePost.selected_size.split('x');
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
		var imageData = {
			src: image.attr('src'),
			width: image.width(),
			height: image.height(),
			linkType: 'do_nothing',
			linkUrl: ''
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
            }
            else
                this.model.set({linkType: type, linkUrl: url});
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

var EmbedInsert = UeditorInsert.extend({
        type: 'embed',
        className: 'ueditor-insert upfront-inserted_embed-wrapper',
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

            this.createControls();
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
            /**
             * Show the embed form after clicking on embed element
             */
            this.controls.$el.show(function(){
                self.controls.$el.find(".upfront-icon-region-embed").next(".uimage-control-panel").show();
                self.controls.$el.find(".upfront-icon-region-embed").click();
                self.controls.$el.find(".upfront-field-embed_code").focus();
            });
        },
        /**
         * Returns output for the element to inserted into the dome
         * @returns html
         */
	getOutput: function(){
		var out = this.el.cloneNode(),
			data = this.data.toJSON()
		;
		if(data.align == 'full')
			data.src = data.srcFull || data.src;

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

         view.on()
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