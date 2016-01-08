(function ($) {
define([
	'elements/upfront-accordion/js/model',
	'elements/upfront-accordion/js/element',
	'elements/upfront-accordion/js/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-accordion/tpl/uaccordion.html',
	'text!elements/upfront-accordion/tpl/preset-style.html'
], function(UaccordionModel, AccordionElement, AccordionSettings, PresetUtil, accordionTpl, settingsStyleTpl) {

	var l10n = Upfront.Settings.l10n.accordion_element;

	var UaccordionView = Upfront.Views.ObjectView.extend({
		model: UaccordionModel,
		currentEditItem: '',
		accordionTpl: Upfront.Util.template(accordionTpl),
		elementSize: {width: 0, height: 0},

		initialize: function(){
			if(! (this.model instanceof UaccordionModel)){
				this.model = new UaccordionModel({properties: this.model.get('properties')});
			}
			this.events = _.extend({}, this.events, {
				// 'click .accordion-add-panel': 'addPanel',
				'click .accordion-panel-title': 'onPanelTitleClick',
				'dblclick .accordion-panel-active .accordion-panel-content': 'onContentDblclick',
				'click i': 'deletePanel'
			});
			this.delegateEvents();

			this.model.get('properties').bind('change', this.render, this);
			this.model.get('properties').bind('change', this.handle_visual_padding_hint, this);
			this.model.get('properties').bind('add', this.render, this);
			this.model.get('properties').bind('remove', this.render, this);


			//this.on('deactivated', this.onDeactivate, this);
			Upfront.Events.on('entity:deactivated', this.stopEdit, this);

			this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
		},
		update_colors: function () {
			var me = this,
				preset = this.model.get_property_value_by_name("preset"),
				props = PresetUtil.getPresetProperties('accordion', preset) || {}
			;
			
			if (_.size(props) <= 0) return false; // No properties, carry on

			PresetUtil.updatePresetStyle('accordion', props, settingsStyleTpl);

		},
		stopEdit: function() {
			var $panelcontent = this.$el.find('.accordion-panel-active .accordion-panel-content');
			$panelcontent.each(function () {
				var $me = $(this),
					editor = $me.data('ueditor');

				if (editor && editor.stop) {
					editor.stop();
				}
			});

			var $paneltitle = this.$el.find('.accordion-panel-active .accordion-panel-title:not(.ueditor-placeholder)');
			$paneltitle.trigger('blur');

			Upfront.Events.trigger('upfront:element:edit:stop');

		},
		addPanel: function(event) {
			event.preventDefault();
			this.property('accordion').push({
				title: l10n.panel_label + ' ' + (1 + this.property('accordion_count')),
				content: l10n.content_label + ' ' + (1 + this.property('accordion_count'))
			});
			this.property('accordion_count', this.property('accordion').length, false);
		},

		deletePanel: function(event) {
			var element = $(event.currentTarget);
			var panel = element.parents('.accordion-panel');
			var id = panel.index();
			this.property('accordion').splice(id, 1);
			this.property('accordion_count', this.property('accordion_count') - 1, false);
		},



		onPanelTitleClick: function(event) {
			var $panelTitle = $(event.currentTarget);
			if($panelTitle.parent().hasClass('accordion-panel-active')) {
				var titleUeditor = $panelTitle.data('ueditor');
				if(titleUeditor) {
					if(!titleUeditor.active)
						titleUeditor.start();
				}
				
			} else {
				this.$el.find('.accordion-panel-content').each(function () {
					var ed = $(this).data('ueditor');
					if (ed) {
						ed.stop();
					}
				});

				$panelTitle.parent().addClass('accordion-panel-active').find('.accordion-panel-content').slideDown();
				$panelTitle.parent().siblings().removeClass('accordion-panel-active').find('.accordion-panel-content').slideUp();

			}
		},

		onContentDblclick: function(event) {
			if($(event.target).data('ueditor')) {
				$(event.target).data('ueditor').start();
			} else {
				event.stopPropagation();
			}
		},

		saveTitle: function(target) {
			//var id = target.closest('div.accordion-panel').index()-1;
			var id = target.closest('div.accordion-panel').index(); // Index is zero-based!!! https://api.jquery.com/index/
			this.property('accordion')[id].title = target.html();
		},

		savePanelContent: function() {
			var panel = this.$el.find('.accordion-panel-active'),
				$content = panel.find('.accordion-panel-content'),
				panelId = panel.index(),
				ed = $content.data('ueditor'),
				text = ''
			;
			try { text = ed.getValue(true); } catch (e) { text = ''; }

			this.property('accordion')[panelId].content = text || $content.html();
			if (text) {
				this.render();
			}
		},


		get_content_markup: function () {
			var props = this.extract_properties();

			props.preset = props.preset || 'default';
			props.show_add = true;
			props.show_remove = this.property('accordion_count') > 1 ? true : false;

			return this.accordionTpl(props);
		},

		extract_properties: function() {
			var props = {};
			this.model.get('properties').each(function(prop){
				props[prop.get('name')] = prop.get('value');
			});
			return props;
		},

		on_render: function() {
			// Accordion won't be rendered in time if you do not delay.
			//_.delay(function(self) {

			//	, 10, this);
			var count = 1;
			var self = this;
			this.$el.find('.accordion-panel-title').each(function() {
				if ($(this).data('ueditor')) {
					return true;
				}
				var $content = $(this);
				$(this).ueditor({
					linebreaks: true,
					disableLineBreak: true,
					airButtons: false,
					allowedTags: ['h5'],
					placeholder: 'Panel '+count
				})
					.on('start', function(){
						self.$el.parent().parent().parent().draggable('disable');
						Upfront.Events.trigger('upfront:element:edit:start', 'text');
					})
					.on('stop', function(){
						self.$el.parent().parent().parent().draggable('enable');
						Upfront.Events.trigger('upfront:element:edit:stop');
					})
					.on('syncAfter', function(){
						self.saveTitle($(this));
					})
					.on('keydown', function(e){
						if (e.which === 9) {
							e.preventDefault();
							self.editContent();
						}
					})
					.on('blur', function() {
						$content.data('ueditor').stop();
					})
					.addClass('uf-click-to-edit-text');

				$(this).data('ueditor').stop();
				count++;
			});
			self.$el.find('.accordion-panel-content').each(function() {
				var $me = $(this);
				if ($me.data('ueditor')) {
					return true;
				}
				$me.ueditor({
						linebreaks: false,
						inserts: {},
						autostart: false
				})
				.on('start', function(){
					//self.$el.parent().parent().parent().draggable('enable');
					Upfront.Events.trigger('upfront:element:edit:start', 'text');
				})
				.on('stop', function(){
					//self.$el.parent().parent().parent().draggable('enable');
					self.savePanelContent();
					Upfront.Events.trigger('upfront:element:edit:stop');
				})
				.on('syncAfter', function(){
					//console.log('edited');
					//self.model.set_content($(this).html(), {silent: true});
				})
				.on('blur', function() {
					//$(this).data('ueditor').stop();
				});
			});
			self.$el.find('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();

			this.$el.find('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();

		},

		editContent: function() {
			this.$el.find('.accordion-panel-active .accordion-panel-content').data('ueditor').start();
			setTimeout(function() {
				Upfront.Events.trigger('upfront:element:edit:start');
			}, 250);
		},

		addTooltips: function() {
			$('.accordion-panel').each(function() {
				var span = $(this).find('span')[0];
				if (span.offsetWidth < span.scrollWidth) {
					$(this).attr('title', $(span).text().trim());
				}
			});
		},

		property: function(name, value, silent) {
			if(typeof value !== 'undefined'){
				if(typeof silent === 'undefined') {
					silent = true;
				}
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		},

		getControlItems: function(){
			return _([
				this.createControl('add', l10n.add_panel, 'addPanel'),
				this.createPaddingControl(),
				this.createControl('settings', l10n.settings, 'on_settings_click')
			]);
		}
	});

		Upfront.Application.LayoutEditor.add_object('Uaccordion', {
			'Model': UaccordionModel,
			'View': UaccordionView,
			'Element': AccordionElement,
			'Settings': AccordionSettings,
			'anchor': {
				is_target: false
			},
			cssSelectors: {
				'.accordion-panel': {label: l10n.css.containers_label, info: l10n.css.containers_info},
				'.accordion-panel-title': {label: l10n.css.header_label, info: l10n.css.header_info},
				'.accordion-panel-active .accordion-panel-title': {label: l10n.css.active_header_label, info: l10n.css.active_header_info},
				'.accordion-panel-content': {label: l10n.css.body_label, info: l10n.css.body_info},
				'.accordion-panel:first-of-type' : {label: l10n.css.first_label, info: l10n.css.first_info},
				'.accordion-panel:last-child' : {label: l10n.css.last_label, info: l10n.css.last_info},
				'.accordion-panel:nth-child(2n+3)' : {label: l10n.css.odd_label, info: l10n.css.odd_info},
				'.accordion-panel:nth-child(2n)' : {label: l10n.css.even_label, info: l10n.css.even_info},
				'.upfront-accordion-wrap': {label: l10n.css.wrap, info: l10n.css.wrap_info}
			},
			cssSelectorsId: Upfront.data.uaccordion.defaults.type
		});

		Upfront.Models.UaccordionModel = UaccordionModel;
		Upfront.Views.UaccordionView = UaccordionView;

}); //End require

})(jQuery);
