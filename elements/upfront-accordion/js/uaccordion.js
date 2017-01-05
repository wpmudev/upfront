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
		currentPanelId: false,
		accordionTpl: Upfront.Util.template(accordionTpl),
		elementSize: {width: 0, height: 0},

		initialize: function(){
			if(! (this.model instanceof UaccordionModel)){
				this.model = new UaccordionModel({properties: this.model.get('properties')});
			}
			this.events = _.extend({}, this.events, {
				'click .accordion-panel-title': 'onPanelTitleClick',
				'dblclick .accordion-panel-title': 'onPanelTitleDblClick',
				'click i': 'deletePanel'
			});
			this.delegateEvents();

			this.model.get('properties').bind('change', this.render, this);
			this.model.get('properties').bind('change', this.handle_visual_padding_hint, this);
			this.model.get('properties').bind('add', this.render, this);
			this.model.get('properties').bind('remove', this.render, this);

			Upfront.Events.on('entity:deactivated', this.stopEdit, this);

			this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
			
			// Check if preset exist, if not replace with default
			this.check_if_preset_exist();
		},
		update_colors: function () {
			var me = this,
				preset = this.model.get_property_value_by_name("preset"),
				props = PresetUtil.getPresetProperties('accordion', preset) || {}
			;
			
			if (_.size(props) <= 0) return false; // No properties, carry on

			PresetUtil.updatePresetStyle('accordion', props, settingsStyleTpl);

		},

		/**
		 * Stops content editing for the active panel
		 */
		stopEdit: function() {
			var $paneltitle = this.$el.find('.accordion-panel .accordion-panel-title');
			$paneltitle.each(function () {
				var $me = $(this),
					editor = $me.data('ueditor');

				if (editor && editor.stop) {
					editor.stop();
				}
			});

			Upfront.Events.trigger('upfront:element:edit:stop');

		},
		addPanel: function(event) {
			event.preventDefault();
			this.property('accordion').push({
				title: l10n.panel_label + ' ' + (1 + this.property('accordion_count')),
				content: $.trim(  l10n.content_label.replace("</p>",   ' ' + (1 + this.property('accordion_count') + "</p>" ) ) ) // inject the number into p tag
			});
			this.property('accordion_count', this.property('accordion').length, false);
		},

		deletePanel: function(event) {
			if (!Upfront.Application.user_can_modify_layout()) return false;

			var element = $(event.currentTarget);
			var panel = element.parents('.accordion-panel');
			var id = panel.index();
			this.property('accordion').splice(id, 1);
			this.property('accordion_count', this.property('accordion_count') - 1, false);
		},

		/**
		 * Toggle panels on title click
		 *
		 * @param {Object} event Event object
		 */
		onPanelTitleClick: function(event) {
			var $panelTitle = $(event.currentTarget),
				$panel_wrapper = $panelTitle.closest(".accordion-panel")
			;
			if (!$panel_wrapper.hasClass('accordion-panel-active')) {
				this.$el.find('.accordion-panel-content').each(function () {
					var ed = $(this).data('ueditor');
					if (ed) {
						ed.stop();
					}
				});

				$panel_wrapper.addClass('accordion-panel-active').find('.accordion-panel-content').slideDown();
				$panel_wrapper.siblings().removeClass('accordion-panel-active').find('.accordion-panel-content').slideUp();
			}
		},

		/**
		 * Activate title editor on panel double-click
		 *
		 * @param {Object} e Event object
		 */
		onPanelTitleDblClick: function (e) {
			if (!Upfront.Application.user_can_modify_layout()) return false;
			var $panel = this.$el.find('.accordion-panel-active'),
				$title = $panel.find(".accordion-panel-title"),
				ed = $title.data("ueditor")
			;
			if (ed && ed.start && !ed.active) ed.start();
		},

/*
		saveTitle: function () {
			var panel = this.$el.find('.accordion-panel-active'),
				$content = panel.find('.accordion-panel-title'),
				panelId = panel.index(),
				ed = $content.data('ueditor'),
				text = ''
			;
			try { text = ed.getValue(true); } catch (e) { text = ''; }

			this.property('accordion')[panelId].title = text || $content.html();
			if (text) {
				this.render();
			}
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
*/

		/**
		 * Save both the title and content of the edited panel
		 *
		 * This method is used instead of (and deprecates) the dedicated individuals methods above.
		 */
		save_panel_content: function () {
			var $panel = this.$el.find('.accordion-panel-active'),
				panelId = $panel.index(),
				$content = $panel.find('.accordion-panel-content'),
				$title = $panel.find('.accordion-panel-title'),
				content_ed = $content.data('ueditor'),
				title_ed = $title.data('ueditor'),
				content = '',
				title = ''
			;
			try { content = content_ed.getValue(true); } catch (e) { content = ''; }
			try { title = title_ed.getValue(true); } catch (e) { title = ''; }
			
			this.currentPanelId = $title.attr('id');
			this.property('accordion')[panelId].content = content || $content.html();
			this.property('accordion')[panelId].title = title || $title.html();
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

		on_render: function () {
			var count = 1,
				self = this
			;
			if (Upfront.Application.user_can_modify_layout()) {
				this.$el.find('.accordion-panel-title').each(function () {
					var $title = $(this);
					if ($title.data('ueditor')) {
						return true;
					}
					$title
						.ueditor({
							linebreaks: false,
							disableLineBreak: true,
							air: false,
							autostart: false,
							placeholder: 'Panel '+count
						})
						.on('start', function () {
							Upfront.Events.trigger('upfront:element:edit:start', 'text');
						})
						.on('stop', function () {
							self.save_panel_content();
							self.render();
							Upfront.Events.trigger('upfront:element:edit:stop');
						})
						.on('syncAfter', function () { self.save_panel_content(); })
						.on('keydown', function (e) {
							// ... so apparently, `linebreaks` argument above wreaks havoc on everything when set to `true`,
							// and `disableLineBreak` does nothing.
							// Very well then, do it ourselves.
							if (e.which === 9 || e.which === 13 ) {
								e.preventDefault();
								e.stopImmediatePropagation();
								return false;
							}
						})
						.addClass('uf-click-to-edit-text')
					;
					
					$title.data('ueditor').stop();
					count++;
				});
				self.$el.find('.accordion-panel-content').each(function() {
					var $me = $(this);
					if ($me.data('ueditor')) {
						return true;
					}
					$me
						.ueditor({
							linebreaks: false,
							autostart: false,
							paragraphize: false,
							focus: false,
							placeholder: false
						})
						.on('start', function(){
							Upfront.Events.trigger('upfront:element:edit:start');
						})
						.on('syncAfter', function () { self.save_panel_content(); })
						.on('stop', function(){
							self.save_panel_content();
							self.render();
							Upfront.Events.trigger('upfront:element:edit:stop');
						})
					;
				});
			} else {
				this.$el.find('.accordion-panel i').remove();
			}
			
			this.$el.find('div#'+ this.currentPanelId).parent().addClass('accordion-panel-active').siblings().removeClass('accordion-panel-active');
			this.$el.find('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();

			Upfront.Events.trigger('entity:object:refresh', this);
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
