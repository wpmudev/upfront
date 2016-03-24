;(function($){define([
	'upfront/post-editor/upfront-post-content', 
	'text!upfront/templates/popup.html', 
	'text!elements/upfront-image/tpl/image_editor.html',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel'
], function(ContentTools, tpls, editorTpl, ElementSettings, RootSettingsPanel){

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

		this.listenTo(Upfront.Events, "entity:modules:render_module", function () {
			$(".upfront-wrapper:not(:visible)").filter('[class*="part-"]').show(); // Undo the wreckage caused by the views
		});

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


        this.$('.upfront-object').addClass("Postpart_" + this.postPart);

		Upfront.Events.trigger('post:layout:partrendered', this);

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

		if(templates && templates[part]) {
			return templates[part];
		}

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
		this.options = opts;
		this.title = opts.title;
		this.slug = this.title.toLowerCase().replace(' ', '_');
		this.Model = PostPartModel;
		this.View = partViews[this.slug] ? partViews[this.slug] : PostPartView;
        this.Settings = PostPartSettings;
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



var _markup_edit = {
	type: 'Button',
	compact: true,
	on_click: function () {
		Upfront.Events.trigger('post:edit:templatepart', this.model.tpl, this.model.get_property_value_by_name('postPart'));
	},
	label: "Edit markup"
};
var Settings_GenericPart = RootSettingsPanel.extend({
	settings: [
		{
			type: 'SettingsItem',
			fields:[_markup_edit]
		}
	]
});
var Settings_DatePart = Settings_GenericPart.extend({
	label: "date",
	settings: [
		{
			type: 'SettingsItem',
			title: "Date",
			fields:[
				{
					type: 'Text',
					label: Upfront.Settings.l10n.global.content.php_date_fmt,
					property: 'format'
				},
				_markup_edit
			]
		}
	],
	title: "Date"
});
var Settings_TagPart = Settings_GenericPart.extend({
	label: "tag",
	settings: [
		{
			type: 'SettingsItem',
			title: "Tag",
			fields:[
				{
					type: 'Text',
					label: Upfront.Settings.l10n.global.content.tag_separator,
					property: 'tag_separator',
				},
				_markup_edit
			]
		}
	],
	title: "Tag"
});
var Settings_ContentPart = Settings_GenericPart.extend({
	label: "content",
	settings: [
		{
			type: 'SettingsItem',
			title: "Content",
			fields:[
				{
					type: 'Number',
					label: Upfront.Settings.l10n.global.content.left,
					property: 'padding_left',
					min: 0,
					step : 1,
				},
				{
					type: 'Number',
					label: Upfront.Settings.l10n.global.content.right,
					property: 'padding_right',
					min: 0,
					step : 1,
				},
				_markup_edit
			]
		}
	],
	title: "Content"
});
var PostPartSettings = ElementSettings.extend({
	initialize: function () {
		var pt = this.model.get_property_value_by_name('postPart');

		this.panels = (pt && this.raw_panels[pt])
			? {General: this.raw_panels[pt]}
			: this.raw_panels
		;
		
		ElementSettings.prototype.initialize.apply(this, arguments);
	},
	raw_panels: {
		date: Settings_DatePart,
		tags: Settings_TagPart,
		contents: Settings_ContentPart,
		title: Settings_GenericPart.extend({ label: "title", title: "Title" }),
		featured_image: Settings_GenericPart.extend({ label: "featured_image", title: "Featured Image" }),
		author: Settings_GenericPart.extend({ label: "author", title: "Author" }),
		author_gravatar: Settings_GenericPart.extend({ label: "gravatar", title: "Gravatar" }),
		comments_count: Settings_GenericPart.extend({ label: "comments_count", title: "Count" }),
		categories: Settings_GenericPart.extend({ label: "categories", title: "Categories" }),
	}
});




var ContentView = PostPartView.extend({
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
        var self = this;
		PostPartView.prototype.render.apply(this, arguments);

		if(!this.paddingChangeHandler){
			this.paddingChangeHandler = _.bind(this.refreshPaddings, this);
			Upfront.Events.on('post:padding:update', this.paddingChangeHandler);
		}
		this.refreshPaddingsFromProperties();
	},

	refreshPaddingsFromProperties: function(){
		this.refreshPaddings((this.property('padding_left') || 0), (this.property('padding_right') || 0));
	},

	refreshPaddings: function(left, right){
		var ge = Upfront.Behaviors.GridEditor,
			colSize = ge.col_size,
			rightPadding = right > 0 ? right * colSize : 15,
			leftPadding = left > 0 ?  left * colSize : 15,
			styles = $('.upfront-region-postlayouteditor').find('.upfront-post-padding'),
			rules = '.upfront-region-postlayouteditor .upfront-output-PostPart_contents {',
			$el = $(".upfront-region-postlayouteditor .upfront-output-PostPart_contents")
		;

		if(!styles.length){
			//Give time to include the layout edition region in the dom
			styles = $('<style class="upfront-post-padding"></style>');
			setTimeout(function(){
				$('.upfront-region-postlayouteditor').append(styles);
			}, 200);
		}

		rules += 'padding-left: ' + leftPadding + 'px; padding-right: ' + rightPadding + 'px;}';
		// Set negative margin to allow image variant resizing on full grid
		rules += '.upfront-region-postlayouteditor  .upfront-output-PostPart_contents .ueditor-insert-variant {';
		rules += ' margin-left: ' + (leftPadding*-1) + 'px; margin-right: ' + (rightPadding*-1) + 'px; }';

		styles.html(rules);
	}
});


var FeaturedImageView = PostPartView.extend({
    sizehintTpl: _.template($(editorTpl).find('#sizehint-tpl').html()),
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


		if(!this.placeholder){
			this.placeholder = $('<div class="upfront-post-thumb-placeholder upfront-ui"><div>' + Upfront.Settings.l10n.global.content.post_featured_image + '</div></div>');
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

        this.update_size_hint();
	},
	resizePlaceholder: function(e){
		this.placeholder.height(this.moduleView.height());
        var height = $('.upfront-resize').height();
        if(e && e.type == 'resizestop') {
			this.model.set_property('height', height, true);
			this.model.set_property('attributes', {style: 'max-height: ' + height + 'px' });
			this.partOptions.height = height;
		}
        this.update_size_hint( height );
	},
    update_size_hint: function( height ){
        height = typeof height === "undefined" ? this.property("height") : height;
        var width = this.$(".upfront-editable_entity").width() ? this.$(".upfront-editable_entity").width() : "100%";
        width = width !== "100%" ? Upfront.Util.grid.normalize_width( width ) : width;
        var resizeHint = $('<div>').addClass('upfront-ui uimage-resize-hint sizehint-top featured-image-sizehint' ).html(this.sizehintTpl({
            width: width ,
            height: height
        }));
        this.placeholder.closest(".upfront-object-view").append(resizeHint);
    }
});
var DateView = PostPartView.extend({
    init: function(options){
        this.partOptions = this.postView.partOptions.date || {};
    },
    on_render: function(){
        var me = this,
            moduleId = this.moduleId || this.parent_module_view.model.get_property_value_by_name('element_id'),
            height = this.partOptions.height || 30,
            parentView = this.parent_module_view
            ;

        this.moduleId = moduleId;
        this.moduleView = parentView.$('#' + moduleId);
        this.moduleView.height( height );
        if(!this.update_attributes_callback)
            this.update_attributes_callback = _.bind(this.update_attributes, this);

        this.moduleView
            .off('resizestop', me.update_attributes_callback)
            .off('resize', me.update_attributes_callback)
            .on('resize', me.update_attributes_callback)
            .on('resizestop', me.update_attributes_callback)
        ;
    },
    update_attributes: function(e){
        if(e && e.type == 'resizestop') {
            var height = $('.upfront-resize').height();
            this.model.set_property('height', height, true);
            this.model.set_property('attributes', {style: 'min-height: ' + height + 'px' });
            this.partOptions.height = height;
        }
    }
});
/*
var partSettings = {
	date: DateSettings,
	update: UpdateSettings,
    tags : TagSettings,
    contents : ContentSettings
};
*/
var partViews = {
	contents: ContentView,
	featured_image: FeaturedImageView,
    date: DateView
};


var TemplateEditorField = Upfront.Views.Editor.Field.Field.extend({
	events: {
		'click .upfront-template-edit': 'prepareTemplateEditor'
	},
	render: function(){
		this.$el.html('<a href="#" title="Edit template" class="upfront-css-edit upfront-template-edit">' + Upfront.Settings.l10n.global.content.edit_html_tpl + '</a>');
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

		require([Upfront.Settings.ace_url], function(){
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

		resizable.html('<div class="upfront-css-top"><span class="upfront-css-type">' + this.postPart + ' Part Template</span><a class="upfront-css-close" href="#">close</a></div>');
		resizable.append('<div class="upfront-css-body"><div class="upfront_code-editor-section upfront_code-markup active"><div class="upfront-css-ace"></div></div><button>' + Upfront.Settings.l10n.global.content.save + '</button></div>');

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
		html += '<p>' + Upfront.Settings.l10n.global.content.save_layout_nag + '</p>';
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
var ImageVariants = new Upfront.Collections.ImageVariants( Upfront.mainData.postImageVariants );
var PrevImageVariants = new Upfront.Collections.ImageVariants( Upfront.mainData.prevPostImageVariants );
var OtherImageVariants = new Upfront.Collections.ImageVariants( Upfront.mainData.otherPostImageVariants );

//Set Upfront.Content
if(!Upfront.Content)
	Upfront.Content = {};

_.extend(Upfront.Content, {
	PostElement: PostPartElement,
	TemplateEditor: TemplateEditor,
	PostPart: PostPartModel,
    ImageVariants : ImageVariants,
	PrevImageVariants: PrevImageVariants,
	OtherImageVariants: OtherImageVariants
});

return {};

//End define
});})(jQuery);
