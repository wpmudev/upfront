(function ($) {

	define([
		'text!elements/upfront-tabs/tpl/utabs.html'
	], function(tabsTpl) {

		var l10n = Upfront.Settings.l10n.utabs_element;

		var UtabsModel = Upfront.Models.ObjectModel.extend({
			init: function () {
				var properties = _.clone(Upfront.data.utabs.defaults);
				var defaults = Upfront.data.utabs.defaults;

				//copy the default tabs data by value, so that the source does not get updated if passed by reference

				properties.tabs = [];
				properties.tabs[0] = {};
				properties.tabs[0].content = _.clone(defaults.tabs[0].content);
				properties.tabs[0].title = _.clone(defaults.tabs[0].title);

				properties.tabs[1] = {};
				properties.tabs[1].content = _.clone(defaults.tabs[1].content);
				properties.tabs[1].title = _.clone(defaults.tabs[1].title);

				properties.element_id = Upfront.Util.get_unique_id('utabs-object');
				this.init_properties(properties);
			}
		});

		var UtabsView = Upfront.Views.ObjectView.extend({
			model: UtabsModel,
			currenttabid: false,
			tabsTpl: Upfront.Util.template(tabsTpl),
			elementSize: {width: 0, height: 0},
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
				// Upfront.Events.on('entity:deactivated', this.stopEdit, this);
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
				var padding = 36;
				if (this.property('theme_style') === 'simple_text') {
					padding = 26;
				}
				if (this.property('theme_style') === 'button_tabs') {
					padding = 47;
					tabSpace = tabSpace + 5;
				}
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
				return this.tabsTpl(
					_.extend(
						this.extract_properties(),
						{
							show_add: true,
							show_remove: this.property('tabs_count') > 1 ? true : false
						}
					)
				);
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

		var TabsElement = Upfront.Views.Editor.Sidebar.Element.extend({
			priority: 100,
			render: function () {
				this.$el.addClass('upfront-icon-element upfront-icon-element-tabs');
				this.$el.html(l10n.element_name);
			},
			add_element: function () {
				var object = new UtabsModel(),
				module = new Upfront.Models.Module({
					'name': '',
					'properties': [
						{'name': 'element_id', 'value': Upfront.Util.get_unique_id('module')},
						{'name': 'class', 'value': 'c9 upfront-tabs_module'},
						{'name': 'has_settings', 'value': 0},
						{'name': 'row', 'value': Upfront.Util.height_to_row(225)}
					],
					'objects': [
						object
					]
				})
				;
				this.add_module(module);
			}
		});

		var TabsSettings = Upfront.Views.Editor.Settings.Settings.extend({
			initialize: function (opts) {
				this.options = opts;
				this.panels = _([
					new AppearancePanel({model: this.model})
				]);
			},

			get_title: function () {
				return l10n.settings;
			}
		});

		var AppearancePanel = Upfront.Views.Editor.Settings.Panel.extend({
			className: 'utabs-settings-panel',
			initialize: function (opts) {
				this.options = opts;
				var render_all,
					me = this;

				render_all = function(){
					this.settings.invoke('render');
				};
				_.bindAll(this, 'onActiveTabColorChange', 'onInactiveTabColorChange', 'onActiveTabTextColorChange', 'onInactiveTabTextColorChange');

				this.model.on('doit', render_all, this);

				this.settings = _([
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: l10n.display_style,
						fields: [
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'theme_style',
								label: l10n.theme_style,
								values: [
									{ label: l10n.tabbed, value: 'tabbed' },
									{ label: l10n.simple_text, value: 'simple_text' },
									{ label: l10n.button_tabs, value: 'button_tabs' }
								]
							})
						]
					})
				]);

				this.$el .on('change', 'input[name=style_type]', function(e){
					me.onStyleTypeChange(e);
				});
				this.$el .on('change', 'input[name=theme_style]', function(e){
					me.onThemeStyleChange(e);
				});
				this.$el .on('change', 'input[name=custom_style]', function(e){
					me.onCustomStyleChange(e);
				});
			},

			onStyleTypeChange: function(event) {
				this.property('style_type', $(event.currentTarget).val(), false);
				this.setColorChooserVisibility();
			},

			onCustomStyleChange: function(event) {
				this.property('custom_style', $(event.currentTarget).val(), false);
				this.setColorChooserVisibility();
			},

			onThemeStyleChange: function(event) {
				this.property('theme_style', $(event.currentTarget).val(), false);
			},

			onActiveTabColorChange: function(event) {
				this.property('active_tab_color', event.toHslString(), false);
			},

			onActiveTabTextColorChange: function(event) {
				this.property('active_tab_text_color', event.toHslString(), false);
			},

			onInactiveTabColorChange: function(event) {
				this.property('inactive_tab_color', event.toHslString(), false);
			},

			onInactiveTabTextColorChange: function(event) {
				this.property('inactive_tab_text_color', event.toHslString(), false);
			},

			setColorChooserVisibility: function() {
				// Use visibility so that settings box will not resize.
				$('.upfront-field-wrap-color').css('visibility', 'hidden');

				if (this.property('style_type') === 'theme_defined') {
					return;
				}

				if (this.property('custom_style') === 'simple_text') {
					$('.text-color').css('visibility', 'visible');
					return;
				}

				$('.upfront-field-wrap-color').css('visibility', 'visible');
			},

			get_label: function () {
				return l10n.appearance;
			},

			get_title: function () {
				return false;
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

			render: function() {
				AppearancePanel.__super__.render.apply(this, arguments);
				_.delay(function(self) {
					self.setColorChooserVisibility();
				}, 1, this);
			}
		});

		Upfront.Application.LayoutEditor.add_object('Utabs', {
			'Model': UtabsModel,
			'View': UtabsView,
			'Element': TabsElement,
			'Settings': TabsSettings,
			'anchor': {
				is_target: false
			}
		});

		Upfront.Models.UtabsModel = UtabsModel;
		Upfront.Views.UtabsView = UtabsView;

	}); //End require

})(jQuery);
