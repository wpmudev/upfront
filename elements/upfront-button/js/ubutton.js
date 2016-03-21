(function ($) {
define([
	'elements/upfront-button/js/model',
	'elements/upfront-button/js/element',
	'elements/upfront-button/js/settings',
	'scripts/upfront/link-model',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-button/tpl/ubutton.html',
	'text!elements/upfront-button/tpl/preset-style.html'
], function(ButtonModel, ButtonElement, ButtonSettings, LinkModel, PresetUtil, buttonTpl, settingsStyleTpl) {

var l10n = Upfront.Settings.l10n.button_element;

var singleclickcount = 0;
var elementClasses = '';
var ButtonView = Upfront.Views.ObjectView.extend({
	model: ButtonModel,
	className: 'upfront-object-view upfront-button',
	buttonTpl: Upfront.Util.template(buttonTpl),
	initialize: function() {
		var me = this;

		//Get all element classes without preset
		this.elementClasses = this.$el.attr('class');

		// For unknown reason some buttons have id_slug button and some
		// ubutton. Normalizing id_slug here for rendering and other stuff
		// to work properly
		this.model.set_property('id_slug', 'ubutton');

		if(! (this.model instanceof ButtonModel)){
			this.model = new ButtonModel({properties: this.model.get('properties')});
		}

		this.events = _.extend({}, this.events, {
			'click a.uf-click-to-edit-text' : 'placeholderClick',
			'click a.redactor_act': 'onOpenPanelClick',
			'click .upfront-save_settings': 'onOpenPanelClick',
			'click .open-item-controls': 'onOpenItemControlsClick'
		});

		this.delegateEvents();

		this.model.get('properties').bind('change', this.render, this);
		this.model.get('properties').bind('change', this.handle_visual_padding_hint, this);
		this.model.get('properties').bind('add', this.render, this);
		this.model.get('properties').bind('remove', this.render, this);
		this.listenTo(this.model, 'change:preset', this.updatePresetClass);

		Upfront.Events.on('entity:deactivated', this.stopEdit, this);

		this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);

		this.listenTo(Upfront.Events, "theme_colors:update", this.render, this);

		if (this.property('link') === false) {
			this.link = new LinkModel({
				type: Upfront.Util.guessLinkType(this.property('href')),
				url: this.property('href'),
				target: this.property('linkTarget')
			});
			this.property('link', this.link.toJSON());
		} else {
			this.link = new LinkModel(this.property('link'));
		}

		me.listenTo(this.link, 'change', function() {
			me.property('link', me.link.toJSON());
		});

	},
	placeholderClick: function(e) {
		e.preventDefault();
	},

	updatePresetClass: function() {
		this.clearPresetClass(this.$el);
		this.$el.addClass(this.property('preset'));
	},

	clearPresetClass: function($el) {
		$el.removeClass();
		$el.addClass(this.elementClasses);
	},

	getCleanurl: function(url) {
		//this one removes any existing # anchor postfix from the url
		var urlParts;
		if(!url){
			url = location.href;
		}

		if(url.indexOf('?dev=true') != -1) url = url.replace('?dev=true', '');

		if(url.indexOf('#') == -1) return url;

		urlParts = url.split('#');

		if(urlParts[0].trim() != '')
			return urlParts[0];
		else
			return location.href.replace('?dev=true', '');
	},

	getUrlanchor: function(url) {
		// this does almost the opposite of the above function

		if(typeof(url) == 'undefined') var url = $(location).attr('href');

		if(url.indexOf('#') >=0) {
			var tempurl = url.split('#');
			return tempurl[1];
		} else return false;
	},

	get_anchors: function () {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = [];
		;
		regions.each(function (r) {
			r.get("modules").each(function (module) {
				module.get("objects").each(function (object) {
					var anchor = object.get_property_value_by_name("anchor");
					if (anchor && anchor.length) anchors[anchor] = object;
				});
			});
		});
		return anchors;
	},

	update_colors: function () {
		var me = this,
			preset = this.model.get_property_value_by_name("preset"),
			props = PresetUtil.getPresetProperties('button', preset) || {}
		;

		if (_.size(props) <= 0) return false; // No properties, carry on

		PresetUtil.updatePresetStyle('button', props, settingsStyleTpl);

	},

	clear_preset_name: function(preset) {
		preset = preset.replace(' ', '-');
		preset = preset.replace(/[^-a-zA-Z0-9]/, '');
		return preset;
	},

	get_content_markup: function () {
		var props = this.extract_properties();

		//Check if preset is empty and set it to currentpreset (porting old data to new preset manager)
		if(props.preset === "" && props.currentpreset != "") {
			props.preset = props.currentpreset;
			this.model.set_property('preset', props.currentpreset)
		}

		props.href = this.link.get('url');
		props.linkTarget = this.link.get('target');

		props.preset = props.preset || 'default';

		props.preset = this.clear_preset_name(props.preset);

		var preset_props = Upfront.Views.Editor.Button.Presets.get(props.preset);

		return this.buttonTpl(props);
	},

	extract_properties: function() {
		var props = {};
		this.model.get('properties').each(function(prop){
			props[prop.get('name')] = prop.get('value');
		});
		return props;
	},

	saveTitle: function(target) {
		this.property('content', target.html());
	},

	is_edited: function () {
		var is_edited = this.model.get_property_value_by_name('is_edited');
		return is_edited ? true : false;
	},

	onOpenPanelClick: function(event) {
		event.preventDefault();
		this.toggleLinkPanel();
	},

	onOpenItemControlsClick: function() {
		this.$el.toggleClass('controls-visible');
		if (this.$el.hasClass('controls-visible')) {
			this.$el.addClass('controls-visible');
			this.controlsVisible = true;
		} else {
			this.controlsVisible = false;
		}
	},

	// createInlineControlPanel: function() {
	// 	var panel = new Upfront.Views.Editor.InlinePanels.ControlPanel(),
	// 		visitLinkControl = new Upfront.Views.Editor.InlinePanels.Controls.VisitLink({
	// 			url: this.link.get('url')
	// 		}),
	// 		linkPanelControl = new Upfront.Views.Editor.InlinePanels.Controls.LinkPanel({
	// 			model: this.link,
	// 			button: false,
	// 			icon: 'link',
	// 			tooltip: 'link',
	// 			id: 'link'
	// 		});
	// 		var me = this;

	// 	this.listenTo(this.link, 'change', function() {
	// 		visitLinkControl.setLink(me.link.get('url'));
	// 		this.$el.find('a').attr('href', me.link.get('url'));
	// 	});

	// 	panel.items = _([
	// 		linkPanelControl,
	// 		visitLinkControl
	// 	]);

	// 	var imageControlsTpl = '<span class="open-item-controls"></span><div class="uimage-controls image-element-controls upfront-ui"></div>';
	// 	this.$el.append(imageControlsTpl);
	// 	panel.render();
	// 	this.$el.find('.uimage-controls').append(panel.el);
	// 	panel.delegateEvents();
	// },

	toggleLinkPanel: function() {
		var me = this;
		if (this.$el.hasClass('stayOpen')) {
			this.$el.removeClass('stayOpen');
			me.render();
		} else {
			this.$el.addClass('stayOpen');
		}
	},


	on_render: function() {
		var me = this,
		blurTimeout = false;
		this.delegateEvents();
		var $target = this.$el.find('.upfront-object-content a.upfront_cta');
		  $target.ueditor({
				linebreaks: true,
				disableLineBreak: true,
				airButtons: ['stateAlignCTA', 'upfrontIcons'],
				placeholder: 'Click here',
				autostart: false
			})
			.on('start', function(){
				var outputobject = $target.closest('.upfront-object-content');
				//var padding = parseInt(outputobject.parent().css('padding-top')) + parseInt(outputobject.parent().css('padding-bottom'));
				outputobject.addClass('editing').css('minHeight', outputobject.parent().height());
				Upfront.Events.trigger('upfront:element:edit:start', 'text');
			})
			.on('stop', function(){
				$target.closest('.upfront-object-content').removeClass('editing').css('minHeight', '');
				me.property('align', $target.css('text-align'), true);
				Upfront.Events.trigger('upfront:element:edit:stop');
				me.render();
			})
			.on('syncAfter', function(){
				me.saveTitle($(this));
			});

		// this.createInlineControlPanel();
		this.clearPresetClass(this.$el);
		this.$el.find('.upfront-button').addClass(this.property('preset'));
	},
	stopEdit: function() {
		var $target = this.$el.find('.upfront-object-content a.upfront_cta');
		$target.trigger('blur');
		Upfront.Events.trigger('upfront:element:edit:stop');
	},

	property: function(name, value, silent) {
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	},

	createLinkControl: function() {
		var me = this,
			linkPanelControl = new Upfront.Views.Editor.InlinePanels.Controls.LinkPanel({
				model: this.link,
				button: false,
				icon: 'link',
				tooltip: l10n.edit_link,
				id: 'link'
			})
		;

		this.listenTo(this.link, 'change', function() {
			//Hide LinkTo button
			//this.visitLinkControl.setLink(me.link.get('url'));
			this.$el.find('a').attr('href', me.link.get('url'));
		});


		return linkPanelControl;
	},

	/* Hide LinkTo button */
	/*
	createVisitLinkControl: function() {
		var me = this,
			visitLinkControl = new Upfront.Views.Editor.InlinePanels.Controls.VisitLink({
				url: this.link.get('url'),
				icon: 'visit-link',
				tooltip: l10n.visit_link,
				id: 'visit-link',
				linkLabel: {
					unlink: '',
					lightbox: '',
					anchor: '',
					entry: '',
					external: '',
					email: ''
				}
			})
		;

		this.visitLinkControl = visitLinkControl;

		return visitLinkControl;
	},
	*/

	getControlItems: function(){
		return _([
			this.createLinkControl(),
			//this.createVisitLinkControl(),
			this.createPaddingControl(),
			this.createControl('settings', l10n.settings.label, 'on_settings_click')
		]);
	}
});


var ButtonMenuList = Upfront.Views.ContextMenuList.extend({
	initialize: function() {
		var me = this;
		this.menuitems = _([
		    new Upfront.Views.ContextMenuItem({
				get_label: function() {

					var linktype = Upfront.Util.guessLinkType(me.for_view.property('href'));
					if(linktype == 'lightbox')
						return 'Open Lightbox';
					else if(linktype == 'anchor')
						return 'Scroll to Anchor';
					else if(linktype == 'entry')
						return 'Visit Post/Page';
					else
						return 'Visit Link';
				},
				action: function() {
					Upfront.Util.visitLink(me.for_view.property('href'));
				}
		    })
		]);
	}
});

Upfront.Application.LayoutEditor.add_object("Button", {
	"Model": ButtonModel,
	"View": ButtonView,
	"Element": ButtonElement,
	"Settings": ButtonSettings,
	cssSelectors: {
		'.upfront_cta': {label: l10n.css.container_label, info: l10n.css.container_info}
	},
	cssSelectorsId: Upfront.data.ubutton.defaults.type
});
Upfront.Models.ButtonModel = ButtonModel;
Upfront.Views.ButtonView = ButtonView;

});
})(jQuery);
