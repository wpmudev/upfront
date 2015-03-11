(function ($) {
define([
	"text!scripts/upfront/templates/link-panel.html",
], function(linkPanelTpl) {

	var LinkPanel = Backbone.View.extend({
		tpl: _.template(linkPanelTpl),

		defaultLinkTypes: {
			unlink: true,
			external: true,
			entry: true,
			anchor: true,
			image: false,
			lightbox: true
		},

		events: {
			'click .js-ulinkpanel-ok': 'linkOk',
			'click .js-ulinkpanel-input-entry': 'openPostSelector',
			'keydown .js-ulinkpanel-lightbox-input': 'checkCreateLightbox'
		},

		initialize: function(opts) {
			var types = opts.linkTypes || {};
			this.linkTypes = _.extend({}, this.defaultLinkTypes, types);

			if(!this.model || this.model.get('type') === false || this.model.get('type') === undefined) {
				this.model = new Backbone.Model({type: 'unlink', url: ''});
			}

			this.theme = opts.theme || 'dark';

			this.button = opts.button || false;

			// Init type select
			var typeValues = [];
			_.each(this.linkTypes, function(use, type) {
				if (!use) {
					return;
				}
				typeValues.push(this.getLinkTypeValue(type));
			}, this);

			this.typeSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: typeValues,
				default_value: this.model.get('type') || 'unlink',
				change: function () {
					me.model.set({'url': ''});// reset url property, we don't want funny results when changing from one type to another
					me.model.set({'type': this.get_value()});
					if (this.get_value() == 'entry') {
						me.openPostSelector();
					}
					me.render();
				}
			});
		},

		render: function() {
			var me = this;
			var anchors = this.anchors || this.getAnchors();

			var tplData = {
				link: this.model.toJSON(),
				theme: this.theme,
				checked: 'checked="checked"',
				lightboxes: this.getLightBoxes(),
				button: this.button,
				type: this.model.get('type')
			};

			this.setCurrentClass(this.model.get('type'));

			this.$el.html(this.tpl(tplData));

			this.typeSelect.render();
			this.$el.find('form').prepend(this.typeSelect.el);

			if (this.model.get('type') == 'anchor') {
				this.renderAnchorSelect();
			}
			if (this.model.get('type') == 'lightbox' && this.getLightBoxes()) {
				this.renderLightBoxesSelect();
			}
			this.delegateEvents();
		},

		renderAnchorSelect: function() {
			var model = this.model;

			var anchorValues = [{label: 'Choose Anchor...', value: ''}];
			_.each(this.getAnchors(), function(anchor) {
				anchorValues.push({label: anchor.label, value: anchor.id});
			});

			var anchorValue = this.model.get('url');
			anchorValue = anchorValue ? anchorValue : '';
			anchorValue = anchorValue.match(/^#/) ? anchorValue : '';

			this.anchorSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: anchorValues,
				default_value: anchorValue,
				change: function () {
					model.set({'url': this.get_value()});
				}
			});
			this.anchorSelect.render();
			this.$el.find('.anchor-selector').append(this.anchorSelect.el);
		},

		renderLightBoxesSelect: function() {
			var model = this.model;
			var lightboxValues = [{label: 'Choose Lightbox...', value: ''}];
			_.each(this.getLightBoxes() || [], function(lightbox) {
				lightboxValues.push({label: lightbox.label, value: lightbox.id});
			});

			var lightboxValue = this.model.get('url');
			lightboxValue = lightboxValue ? lightboxValue : '';
			lightboxValue = lightboxValue.match(/^#/) ? lightboxValue : '';

			this.lightboxSelect = new Upfront.Views.Editor.Field.Select({
				label: '',
				values: lightboxValues,
				default_value: lightboxValue,
				change: function () {
					model.set({'url': this.get_value()});
				}
			});
			this.lightboxSelect.render();
			this.$el.find('.lightbox-selector').append(this.lightboxSelect.el);
		},

		delegateEvents: function(events) {
			if (this.typeSelect) {
				this.typeSelect.delegateEvents();
			}
			if (this.anchorSelect) {
				this.anchorSelect.delegateEvents();
			}
			if (this.lightboxSelect) {
				this.lightboxSelect.delegateEvents();
			}
			Backbone.View.prototype.delegateEvents.call(this, events);
		},

		getLinkTypeValue: function(type) {
			var contentL10n = Upfront.Settings.l10n.global.content;
			switch(type) {
				case 'unlink':
					return { value: 'unlink', label: contentL10n.no_link };
				case 'external':
					return { value: 'external', label: contentL10n.url };
				case 'entry':
					return { value: 'entry', label: contentL10n.post_or_page };
				case 'anchor':
					return { value: 'anchor', label: contentL10n.anchor };
				case 'image':
					return { value: 'image', label: contentL10n.larger_image };
				case 'lightbox':
					return { value: 'lightbox', label: contentL10n.lightbox };
			}
		},

		linkOk: function(e) {
			if(e) e.preventDefault();

			var link = this.getCurrentValue();

			//If we are creating a lightbox just call the method.
			if(link.type == 'lightbox' && this.$('.js-ulinkpanel-new-lightbox').is(':visible'))
				return this.createLightBox();

			this.model.set(link, {silent: true});
			this.trigger('link:ok', link);
		},

		changeType: function(e){
			var type = this.getCurrentLinkType();

			this.$('.js-ulinkpanel-input-url').hide();

			if(type) {
				this.$('.js-ulinkpanel-input-' + type).show();
			}

			this.setCurrentClass(type);

			//Is it really an event or is it called by other function?
			//Check the event object
			if(e){
				this.trigger('link:typechange', type);
				if(type == 'entry')
					this.openPostSelector();
			}
		},

		getCurrentValue: function(){
			var type = this.getCurrentLinkType(),
				url = this.getTypeUrl(type)
			;
			return {type: type, url: url};
		},

		getCurrentLinkType: function() {
			return this.model.get('type') || 'unlink';
		},

		getTypeUrl: function(type){
			var url;
			switch(type){
				case 'unlink':
					return '';
				case 'external':
				case 'entry':
					// Check if the url is absolute or have a protocol.
					url = this.$('#ulinkpanel-link-url').val();
					return url.match(/https?:\/\//) || url.match(/\/\/:/) ? url : 'http://' + url;
				case 'anchor':
					return this.model.get('url');
				case 'image':
					return '#';
				case 'lightbox':
					return this.model.get('url');
			}

			//Not a type, return current url
			return this.$('#ulinkpanel-link-url').val();
		},

		getAnchors: function(){
			var regions = Upfront.Application.layout.get("regions"),
				anchors = [],
				find = function (modules) {
					modules.each(function(module){
						if ( module.get("objects") )
							module.get("objects").each(function (object) {
								var anchor = object.get_property_value_by_name("anchor");
								if (anchor && anchor.length)
									anchors.push({id: '#' + anchor, label: anchor});
							});
						else if ( module.get("modules") )
							find(module.get("modules"));
					});
				}
			;
			regions.each(function (r) {
				find(r.get("modules"));
			});

			this.anchors = anchors;
			return anchors;
		},

		openPostSelector: function(e){
			if(e)
				e.preventDefault();

			this.trigger('link:postselector');

			var me = this,
				selectorOptions = {
					postTypes: this.postTypes()
				}
			;
			Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
				var link = {
					url: post.get('permalink'),
					type: 'entry'
				};

				me.model.set(link);
				me.render();

				me.trigger('link:postselected', link, post);
			});
		},

		postTypes: function(){
			var types = [];
			_.each(Upfront.data.ugallery.postTypes, function(type){
				if(type.name != 'attachment')
					types.push({name: type.name, label: type.label});
			});
			return types;
		},

		getLightBoxes: function(){
			var lightboxes = [],
				regions = Upfront.Application.layout.get('regions')
			;

			_.each(regions.models, function(model) {
				if(model.attributes.sub == 'lightbox')
					lightboxes.push({id: '#' + model.get('name'), label: model.get('title')});
			});

			return lightboxes;
		},

		checkCreateLightbox: function(e){
			if(e.which == 13){
				e.preventDefault();
				this.createLightBox();
			}
		},

		createLightBox: function(){
			var name = $.trim(this.$('.js-ulinkpanel-lightbox-input').val());
			if(!name){
				Upfront.Views.Editor.notify(l10n.ltbox_empty_name_nag, 'error');
				return false;
			}

			var safeName = Upfront.Application.LayoutEditor.createLightboxRegion(name),
				url = '#' + safeName
			;

			this.model.set({url: url, type: 'lightbox'});
			this.render();

			this.linkOk();
		},

		setCurrentClass: function(type) {
			this.$el.attr('class', 'ulinkpanel ulinkpanel-' + this.theme + ' ulinkpanel-selected-' + type);
		}
	});

	return LinkPanel;

});
})(jQuery);
