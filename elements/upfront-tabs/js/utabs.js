(function ($) {
define([
	'elements/upfront-tabs/js/model',
	'elements/upfront-tabs/js/element',
	'elements/upfront-tabs/js/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-tabs/tpl/utabs.html',
	'text!elements/upfront-tabs/tpl/preset-style.html'
], function(UtabsModel, TabsElement, TabsSettings, PresetUtil, tabsTpl, settingsStyleTpl) {
	var l10n = Upfront.Settings.l10n.utabs_element;

	// Kill live site tab handling
	$('body').off('touchstart click', '.tabs-tab');

	var UtabsView = Upfront.Views.ObjectView.extend({
		model: UtabsModel,
		currentTabId: false,
		tabsTpl: Upfront.Util.template(tabsTpl),
		elementSize: {width: 0, height: 0},

		initialize: function(){
			if(! (this.model instanceof UtabsModel)){
				this.model = new UtabsModel({properties: this.model.get('properties')});
			}

			// Setup default tab titles, ditch placeholder stuff
			var tabs = this.property('tabs');
			_.each(tabs, function(tab, index) {
				if (tab.title.trim() === '') {
					tabs[index].title = l10n.tab_label + ' ' + (index + 1);
				}
			});
			this.property('tabs', tabs);

			this.events = _.extend({}, this.events, {
				// 'click .add-item': 'addTab',
				'click .tabs-tab': 'onTabClick',
				'keydown .tabs-tab[contenteditable=true]': 'onTabKeydown',
				'click .utab-content-active': 'onContentClick',
				'click i': 'deleteTab',
				'dblclick .utab-content:not(.redactor-editor)': 'startContentEditor'
			});
			this.delegateEvents();

			this.model.get('properties').bind('change', this.render, this);
			this.model.get('properties').bind('change', this.handle_visual_padding_hint, this);
			this.model.get('properties').bind('add', this.render, this);
			this.model.get('properties').bind('remove', this.render, this);

			this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
		},

		update_colors: function () {
			var me = this,
				preset = this.model.get_property_value_by_name("preset"),
				props = PresetUtil.getPresetProperties('tab', preset) || {}
			;

			if (_.size(props) <= 0) return false; // No properties, carry on

			PresetUtil.updatePresetStyle('tab', props, settingsStyleTpl);

		},

		onContentClick: function() {
			this.$el.find('.tabs-tab-active .inner-box').trigger('blur');
		},

		addTab: function(e) {
			e.preventDefault();
			this.property('tabs').push({
				title: l10n.tab_label + ' ' + (1 + this.property('tabs_count')),
				content: l10n.content_label + ' ' + (1 + this.property('tabs_count'))
			});
			this.property('tabs_count', this.property('tabs').length, false);
			this.render();
		},

		deleteTab: function(event) {
			var element = $(event.currentTarget);
			var tab = element.parents('.tabs-tab');
			var id = $(tab).data('content-id').split('-').pop();
			this.property('tabs').splice(id, 1);
			this.property('tabs_count', this.property('tabs_count') - 1, false);
		},

		onTabClick: function(event) {
			var $tab = $(event.currentTarget);
			var contentId;

			// Stop tab content editor on switching tabs, always
			this.$el.find('.utab-content').each(function () {
				var ed = $(this).data('ueditor');
				if(ed && ed.active) {
					ed.stop();
				}
			});

			// If tab is already active start editor if not started already
			if ($tab.hasClass('tabs-tab-active')) {
				var ed = $tab.find('.inner-box').data('ueditor');
				if(ed && !ed.active) {
					ed.start();
				}

				return;
			}

			// Otherwise stop all tab editors just in case
			this.$el.find('.tabs-tab .inner-box').each(function() {
				var ed = $(this).data('ueditor');
				if(ed && ed.active) {
					$(this).trigger('blur');
				}
			});

			// And make tab active
			$tab
				.siblings().removeClass('tabs-tab-active').end()
				.addClass('tabs-tab-active');
			$('#' + $tab.data('content-id'))
				.siblings().removeClass('utab-content-active').end()
				.addClass('utab-content-active');
		},

		saveTabContent: function($content) {
			var
				tabId = $content.attr('id').split('-').pop(),
				ed = $content.data('ueditor'),
				text = '';

			try {
				text = ed.getValue(true);
			} catch (e) {
				text = $content.html();
			}
			this.currentTabId = $content.attr('id');
			this.property('tabs')[tabId].content = text;
			this.render();
		},

		stopEdit: function(event) {
			var $content = this.$el.find('.utab-content-active'),
				ed = $content.data('ueditor');

			if (ed && ed.active) {
				ed.stop();
			}

			if(typeof event !== 'undefined' && $(event.target).hasClass('inner-box')) {
				return;
			}


			var $tab = this.$el.find('.tabs-tab-active .inner-box:not(.ueditor-placeholder)');
			$tab.trigger('blur');
		},

		onTabKeydown: function(event) {
			var id;
			if (event.keyCode === 13) {
				event.preventDefault();
				$(event.currentTarget).removeAttr('contenteditable');
				id = $(event.currentTarget).data('content-id').split('-').pop();
				this.property('tabs')[id].title = $(event.currentTarget).text();
				this.addTooltips();
				if ($(event.currentTarget).find('i').size() < 1) {
					$(event.currentTarget).append('<i></i>');
				}
			}
		},

		get_content_markup: function () {
			var props = this.extract_properties();

			props.show_add = true;
			props.show_remove = this.property('tabs_count') > 1 ? true : false;
			props.preset = props.preset || 'default';

			return this.tabsTpl(props);
		},

		extract_properties: function() {
			var props = {};
			this.model.get('properties').each(function(prop){
				props[prop.get('name')] = prop.get('value');
			});
			return props;
		},

		on_render: function() {
			// Tabs won't be rendered in time if no delay.
			_.delay(function(self) {
				self.addTooltips();
			}, 10, this);

			var me = this,
				$tabtitles = this.$el.find('.tabs-tab .inner-box'),
				count = 0,
				$tabs;

			$tabtitles.each(function () {
				var $content = $(this);
				count++;

				$content.ueditor({
					//linebreaks: true,
					//disableLineBreak: true,
					//airButtons: false,
					//autostart: false,
					//allowedTags: ['h5'],
					//placeholder: false
					//airButtons : ["upfrontFormatting"],
					linebreaks: false,
					autostart: false,
					paragraphize: false,
					focus: false,
					placeholder: false
				}).on('start', function() {
				 Upfront.Events.trigger('upfront:element:edit:start', 'text');
				 $(this).focus();
			 }).on('stop', function () {
				 var id = $content.parent().parent().data('content-id').split('-').pop();
				 var editor = $content.data('ueditor');
				 if (editor.getValue(true).trim() === '') {
					 me.property('tabs')[id].title =  l10n.tab_label + ' ' + count;
					 setTimeout( function() {
						 $content.text(l10n.tab_label + ' ' + count);
					 }, 50);
				 } else {
					 me.property('tabs')[id].title =  editor.getValue(true).trim();
				 }
				 Upfront.Events.trigger('upfront:element:edit:stop');
			 });


			});

			$tabs = this.$el.find('.utab-content');

			$tabs.each(function () {
				me.initializeContentEditor($(this));
			});

			var $upfrontObjectContent = this.$el.find('.upfront-object-content');
			// if(this.$el.find('a.add-item').length < 1) {
			// 	$('<b class="upfront-entity_meta upfront-ui add_item"><a href="" class="upfront-icon-button add-item"></a></b>').insertBefore($upfrontObjectContent);
			// }

			this.$el.find('div#'+ this.currentTabId).addClass('utab-content-active').siblings().removeClass('utab-content-active');

			this.$el.find('.tabs-tab').removeClass('tabs-tab-active');
			this.$el.find('div.tabs-tab[data-content-id="' + this.$el.find('div.utab-content-active').attr('id')+'"]').addClass('tabs-tab-active');
		},

		startContentEditor: function(event) {
			$(event.currentTarget).data('ueditor').start();
		},

		initializeContentEditor: function($content) {
			var me = this;

			$content.ueditor({
				linebreaks: false,
				autostart: false,
				paragraphize: false,
				focus: false,
				placeholder: false
			})
				.on('start', function () {
					Upfront.Events.trigger('upfront:element:edit:start', 'text');
				})
				.on('stop', function () {
					me.stopContentEdit($content);
				});
		},

		stopContentEdit: function($content) {
			if($content.text().trim() === '') {
				$content.html(l10n.tab_placeholder);
			}
			this.saveTabContent($content);
			Upfront.Events.trigger('upfront:element:edit:stop');
		},

		addTooltips: function() {
			$('.tabs-tab').each(function() {
				var span = $(this).find('span')[0];
				if ( !_.isUndefined(span) && ( span.offsetWidth < span.scrollWidth ) ) {
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
				this.createControl('add', l10n.add_tab, 'addTab'),
				this.createPaddingControl(),
				this.createControl('settings', l10n.settings, 'on_settings_click')
			]);
		}
	});

	Upfront.Application.LayoutEditor.add_object('Utabs', {
		'Model': UtabsModel,
		'View': UtabsView,
		'Element': TabsElement,
		'Settings': TabsSettings,
		'anchor': {
			is_target: false
		},
		cssSelectors: {
			'.upfront-tabs-container': {label: l10n.css.container_label, info: l10n.css.container_info},
			'.upfront-tabs-container .tabs-menu-wrapper': {label: l10n.css.menu_label, info: l10n.css.menu_info},
			'.upfront-tabs-container .tabs-tab .inner-box': {label: l10n.css.tabs_label, info: l10n.css.tabs_info},
			'.upfront-tabs-container .tabs-tab-active .inner-box' : {label: l10n.css.active_tab_label, info: l10n.css.active_tab_info},
			'.upfront-tabs-container .utabs-content': {label: l10n.css.tab_content_label, info: l10n.css.tab_content_info},
			'.upfront-tabs-container .utabs-content p': {label: l10n.css.tab_p_label, info: l10n.css.tab_p_info},
			'.upfront-tabs-container .utab-content-active': {label: l10n.css.active_content_label, info: l10n.css.active_content_info},
			'.upfront-tabs-container .utab-content-active p': {label: l10n.css.active_p_label, info: l10n.css.active_p_info}
		},
		cssSelectorsId: Upfront.data.utabs.defaults.type
	});

	Upfront.Models.UtabsModel = UtabsModel;
	Upfront.Views.UtabsView = UtabsView;

});
})(jQuery);
