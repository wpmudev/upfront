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

	var UtabsView = Upfront.Views.ObjectView.extend({
		model: UtabsModel,
		currenttabid: false,
		tabsTpl: Upfront.Util.template(tabsTpl),
		elementSize: {width: 0, height: 0},
		initialize: function(){
			if(! (this.model instanceof UtabsModel)){
				this.model = new UtabsModel({properties: this.model.get('properties')});
			}

			this.events = _.extend({}, this.events, {
				'click .add-item': 'addTab',
				'click .tabs-tab': 'onTabClick',
				'keydown .tabs-tab[contenteditable=true]': 'onTabKeydown',
				'click .tab-content-active': 'onContentClick',
				'click i': 'deleteTab',
				'dblclick .tab-content': 'checkEditorExists'
			});
			this.delegateEvents();

			this.model.get('properties').bind('change', this.render, this);
			this.model.get('properties').bind('add', this.render, this);
			this.model.get('properties').bind('remove', this.render, this);

			Upfront.Events.on('entity:resize_stop', this.onResizeStop, this);

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
			this.stopEdit();
			this.property('tabs').push({
				title: '',
				content: 'Content ' + (1 + this.property('tabs_count'))
			});
			this.property('tabs_count', this.property('tabs').length, false);
		},

		deleteTab: function(event) {
			var element = $(event.currentTarget);
			var tab = element.parents('.tabs-tab');
			var id = $(tab).data('content-id').split('-').pop();
			this.property('tabs').splice(id, 1);
			this.property('tabs_count', this.property('tabs_count') - 1, false);
		},

		fixTabWidth: function() {
			// Space for tabs is equal to: whole el width - add tab button - padding
			var tabSpace = this.$el.width() - 36 - 30;
			var tabsWidth = 0;
			var tabWidth = 'auto';
			var spanWidth;
			this.$el.find('.tabs-menu .tabs-tab').css('width', 'auto');
			this.$el.find('.tabs-tab').each(function() {
				tabsWidth += $(this).outerWidth();
			});

			if (tabsWidth > tabSpace) {
				tabWidth = (tabSpace - 10) / this.property('tabs_count');
				spanWidth = Math.floor(tabWidth) + 'px';
				this.property('tabs_fixed_width', spanWidth);
				this.$el.find('.tabs-menu .tabs-tab').css('width', spanWidth);
			} else {
				this.property('tabs_fixed_width', 'auto');
				this.$el.find('.tabs-menu .tabs-tab').css('width', 'auto');
			}
		},

		onTabClick: function(event) {
			var $tab = $(event.currentTarget);
			var contentId;

			// Stop editor on switching tabs, always
			var $all_tabs = this.$el.find('.tab-content');


			$all_tabs.each(function () {
				var ed = $(this).data('ueditor');
				if(ed) {
					ed.stop();
				}
			});

			if ($tab.hasClass('tabs-tab-active')) {
				var ed = $tab.find('.inner-box').data('ueditor');
				if(ed) {
					ed.start();
				}

				return;
			} else {
				var $tabtitles = this.$el.find('.tabs-tab .inner-box');
				$tabtitles.each(function() {
					var ed = $(this).data('ueditor');
					if(ed) {
						$(this).trigger('blur');
					}
				});
			}

			this.$el.find('.tabs-tab-active').removeClass('tabs-tab-active');
			contentId = $tab.data('content-id');
			this.$el.find('#' + contentId).siblings().removeClass('tab-content-active');
			this.$el.find('#' + contentId).addClass('tab-content-active');

			 this.$el.find('.tabs-tab[data-content-id="' + $tab.data('content-id') + '"]').addClass('tabs-tab-active');
		},

		saveTabContent: function() {
			var $content = this.$el.find('.tab-content-active'),
				tabId = $content.attr('id').split('-').pop(),
				ed = $content.data('ueditor'),
				text = '';

			try {
				text = ed.getValue(true);
			} catch (e) {
				text = $content.html();
			}
			this.currenttabid = $content.attr('id');
			this.property('tabs')[tabId].content = text;
		},

		stopEdit: function(e) {
			var $content = this.$el.find('.tab-content-active'),
				ed = $content.data('ueditor');

			if (ed) {
				ed.stop();
			}

			if(typeof(e) !== 'undefined' && $(e.target).hasClass('inner-box')) {
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
				this.fixTabWidth();
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

		onResizeStop: function() {
			this.fixTabWidth();
		},

		on_render: function() {
			// Tabs won't be rendered in time if no delay.
			_.delay(function(self) {
				self.fixTabWidth();
				self.addTooltips();
			}, 10, this);

			var me = this,
				$tabtitles = this.$el.find('.tabs-tab .inner-box'),
				count = 1,
				$tabs;

			$tabtitles.each(function () {
				var $content = $(this);

				$content.ueditor({
					linebreaks: true,
					disableLineBreak: true,
					airButtons: false,
					allowedTags: ['h5'],
					placeholder: 'Tab '+count
			 }).on('start', function() {
				 Upfront.Events.trigger('upfront:element:edit:start', 'text');
				 $(this).focus();
			 }).on('stop', function () {
				 var id = $content.parent().parent().data('content-id').split('-').pop();
				 me.property('tabs')[id].title = $content.text();
				 Upfront.Events.trigger('upfront:element:edit:stop');
			 }).on('blur', function() {
				 $content.data('ueditor').stop();
			 });
			 $content.data('ueditor').stop();


				count++;
			});

			$tabs = this.$el.find('.tab-content');

			$tabs.each(function () {
				me.initializeContentEditor($(this));
			});

			var $upfrontObjectContent = this.$el.find('.upfront-object-content');
			if(this.$el.find('a.add-item').length < 1) {
				$('<b class="upfront-entity_meta upfront-ui add_item"><a href="" class="upfront-icon-button add-item"></a></b>').insertBefore($upfrontObjectContent);
			}

			this.$el.find('div#'+ this.currenttabid).addClass('tab-content-active').siblings().removeClass('tab-content-active');

			this.$el.find('.tabs-tab').removeClass('tabs-tab-active');
			this.$el.find('div.tabs-tab[data-content-id="' + this.$el.find('div.tab-content-active').attr('id')+'"]').addClass('tabs-tab-active');
		},

		checkEditorExists: function(event) {
			var editor = $(event.target).data('ueditor');

			if (!editor) {
				this.initializeContentEditor($(event.target));
				$(event.target).data('ueditor').start();
			} else {
				$(event.target).data('ueditor').start();
			}
		},

		initializeContentEditor: function($content) {
			var me = this;

			$content.ueditor({
				linebreaks: false,
				autostart: false,
				inserts: {},
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
				$content.html('Tab Content');
			}
			this.saveTabContent();
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
			'.upfront-object-content': {label: l10n.css.container_label, info: l10n.css.container_info},
			'.upfront-tabs-container .tabs-menu-wrapper': {label: l10n.css.menu_label, info: l10n.css.menu_info},
			'.upfront-tabs-container .tabs-tab .inner-box': {label: l10n.css.tabs_label, info: l10n.css.tabs_info},
			'.upfront-tabs-container .tabs-tab-active .inner-box' : {label: l10n.css.active_tab_label, info: l10n.css.active_tab_info},
			'.upfront-tabs-container .tabs-content': {label: l10n.css.tab_content_label, info: l10n.css.tab_content_info},
			'.upfront-tabs-container .tabs-content p': {label: l10n.css.tab_p_label, info: l10n.css.tab_p_info},
			'.upfront-tabs-container .tab-content-active': {label: l10n.css.active_content_label, info: l10n.css.active_content_info},
			'.upfront-tabs-container .tab-content-active p': {label: l10n.css.active_p_label, info: l10n.css.active_p_info}
		},
		cssSelectorsId: Upfront.data.utabs.defaults.type
	});

	Upfront.Models.UtabsModel = UtabsModel;
	Upfront.Views.UtabsView = UtabsView;

});
})(jQuery);
