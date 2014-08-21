(function ($) {

	define([
		'text!elements/upfront-tabs/tpl/utabs.html'
	], function(tabsTpl) {
		var UtabsModel = Upfront.Models.ObjectModel.extend({
			init: function () {
				var properties = _.clone(Upfront.data.utabs.defaults);
				var defaults = Upfront.data.utabs.defaults;
				
				//copy the default tabs data by value, so that the source does not get updated if passed by reference
				
				properties['tabs'] = [];
				properties['tabs'][0] = {};
				properties['tabs'][0]['content'] = _.clone(defaults['tabs'][0]['content']);
				properties['tabs'][0]['title'] = _.clone(defaults['tabs'][0]['title']);

				properties['tabs'][1] = {};
				properties['tabs'][1]['content'] = _.clone(defaults['tabs'][1]['content']);
				properties['tabs'][1]['title'] = _.clone(defaults['tabs'][1]['title']);

				properties.element_id = Upfront.Util.get_unique_id("utabs-object");
				this.init_properties(properties);
			}
		});

		var UtabsView = Upfront.Views.ObjectView.extend({
			model: UtabsModel,
			currenttabid: false,
			tabsTpl: Upfront.Util.template(tabsTpl),
			elementSize: {width: 0, height: 0},
			cssSelectors: {
				'.upfront-object-content': {label: 'Tabs container', info: 'The layer that contains all the contents of the tab element.'},
				'.upfront-tabs-container .tabs-menu-wrapper': {label: 'Tabs menu', info: 'The row that contains all tabs'},
				'.upfront-tabs-container .tabs-tab .inner-box': {label: 'Tabs', info: 'Each of the tabs.'},
				'.upfront-tabs-container .tabs-tab-active .inner-box' : {label: 'Active tab', info: "Active tab"},
				'.upfront-tabs-container .tabs-content': {label: 'Tab content', info: "The layber that wraps tab content"},
				'.upfront-tabs-container .tabs-content p': {label: 'Tab content paragraph', info: "The paragraph that contains tab content"},
				'.upfront-tabs-container .tab-content-active': {label: 'Active tab content', info: "The layber that wraps active tab content"},
				'.upfront-tabs-container .tab-content-active p': {label: 'Active tab content paragraph', info: "The paragraph that contains active tab content"}

			},

			initialize: function(){
				var me = this;
				if(! (this.model instanceof UtabsModel)){
					this.model = new UtabsModel({properties: this.model.get('properties')});
				}

				this.events = _.extend({}, this.events, {
					'click .add-item': 'addTab',
					'click .tabs-tab': 'onTabClick',
					'keydown .tabs-tab[contenteditable=true]': 'onTabKeydown',
					'keydown .tab-content-active': 'onContentKeydown',
					//'dblclick .tab-content-active': 'onContentDblclick',
					'click .tab-content-active': 'onContentClick',
					'click i': 'deleteTab'
				});
				this.delegateEvents();
				
				this.model.get("properties").bind("change", this.render, this);
				this.model.get("properties").bind("add", this.render, this);
				this.model.get("properties").bind("remove", this.render, this);

				Upfront.Events.on("entity:resize_stop", this.onResizeStop, this);
				Upfront.Events.on("entity:deactivated", this.stopEdit, this);
				
				//this.on('deactivated', this.stopEdit, this);
				this.debouncedSave = _.debounce(this.saveTabContent, 1000);
			},
			onContentClick: function() {
				this.$el.find('.tabs-tab-active .inner-box').trigger('blur');
			},
			addTab: function() {
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
				if (this.property('theme_style') === 'simple_text') padding = 26;
				if (this.property('theme_style') === 'button_tabs') {
					padding = 47;
					tabSpace = tabSpace + 5;
				}
				this.$el.find('.tabs-menu span').css('width', 'auto');
				this.$el.find('.tabs-tab').each(function() {
					tabsWidth += $(this).outerWidth();
				});

				if (tabsWidth > tabSpace) {
					tabWidth = (tabSpace - 10) / this.property('tabs_count');
					spanWidth = Math.floor(tabWidth) - padding + 'px';
					this.property('tabs_fixed_width', spanWidth);
					this.$el.find('.tabs-menu span').css('width', spanWidth);
				} else {
					this.property('tabs_fixed_width', 'auto');
					this.$el.find('.tabs-menu span').css('width', 'auto');
				}
			},

			onTabClick: function(event) {
				var $tab = $(event.currentTarget);
				var contentId;

				// Stop editor on switching tabs, always
				var $all_tabs = this.$el.find(".tab-content");
				

				$all_tabs.each(function () {
					var ed = $(this).data("ueditor");
					if(ed)
						ed.stop();
				});

				if ($tab.hasClass('tabs-tab-active')) {
					//$tab.attr('contenteditable', true);
					var ed = $tab.find('.inner-box').data("ueditor");
					if(ed) {
						ed.start();
					}
					
					//$tab.find('span').css('width', 'auto');
					//$tab.find('.inner-box').focus();
					return;
				}
				else {
					var $tabtitles = this.$el.find(".tabs-tab .inner-box");
					$tabtitles.each(function() {
						var ed = $(this).data('ueditor');
						if(ed) {
							$(this).trigger('blur');
						}
					});
				}

//				$tab.siblings().removeClass('tabs-tab-active');//.removeAttr('contenteditable');
				this.$el.find('.tabs-tab-active').removeClass('tabs-tab-active');
				// If active content is edited save edits & destroy editor.
				/*
				if (this.$el.find('.tab-content-active').attr('contenteditable') === true) {
					this.stopEdit();
				}
				*/
				contentId = $tab.data('content-id');
				this.$el.find('#' + contentId).siblings().removeClass('tab-content-active');
				this.$el.find('#' + contentId).addClass('tab-content-active');

				 this.$el.find(".tabs-tab[data-content-id='" + $tab.data('content-id') + "']").addClass('tabs-tab-active');
				//$tab.addClass('tabs-tab-active');

			},
/*
			onContentDblclick: function(event) {
				var $content = $(event.currentTarget);

				if ($content.attr('contenteditable') === true) return;

				$content.attr('contenteditable', true)
					.addClass('upfront-object');

				$content.ueditor({
					linebreaks: false,
					inserts: {},
					autostart: false
				});
				//$content.focus();
				//this.$el.parent().parent().parent().draggable('disable');
			},
*/
			onContentKeydown: function(event) {
				//this.debouncedSave();
			},

			saveTabContent: function() {
								
				var $content = this.$el.find('.tab-content-active'),
					tabId = $content.attr('id').split('-').pop(),
					ed = $content.data("ueditor"),
					text = ''
				;
				try { text = ed.getValue(true); } catch (e) { text = $content.html(); }
var me = this;
					this.currenttabid = $content.attr('id');
					me.property('tabs')[tabId].content = text; 
				
			},

			stopEdit: function(e) {
				
				
				//this.saveTabContent();
				var $content = this.$el.find('.tab-content-active');
				var ed = $content.data('ueditor');
				if(ed)
					ed.stop();
				
				if(typeof(e) != 'undefined' && $(e.target).hasClass('inner-box'))
					return;
					
					
				var $tab = this.$el.find('.tabs-tab-active .inner-box:not(.ueditor-placeholder)');
				$tab.trigger('blur');
				
				
				
				/*if($tab.length > 0 && !($tab.siblings('.ueditor-placeholder').length && $tab.siblings('.ueditor-placeholder').css('display') != 'none')) {
					$tab.trigger('blur');
				}
				else {
					$tab.addClass('newtab');	
				}*/
				//var text='';
				//ed = $tab.data('ueditor');
				
					
				//if(ed)
					//ed.stop();
//					.removeAttr('contenteditable')
//					.removeClass('upfront-object');
			//	if (this.editor && this.editor.destroy) this.editor.destroy();
			//	this.$el.parent().parent().parent().draggable('enable');
			//	this.delegateEvents();
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

			onResizeStop: function(view, model, ui) {
				this.fixTabWidth();
			},

			on_render: function() {

				// Tabs won't be rendered in time if you do not delay.
				_.delay(function(self) {
					self.fixTabWidth();
					self.addTooltips();
				}, 10, this);
				
				var me = this;
				
				var $tabtitles = this.$el.find(".tabs-tab .inner-box");
				var count = 1;
				$tabtitles.each(function () {
					var $content = $(this);
					$content.ueditor({
						linebreaks: true,
						disableLineBreak: true,
						//focus: true,
						//autostart: false,
						//tabFocus: false,
						airButtons: false,
						allowedTags: ['h5'],
						placeholder: 'Tab '+count
					 }).on('start', function(e) {
						Upfront.Events.trigger('upfront:element:edit:start', 'text');
						$(this).focus();
					 }).on("stop", function () {
						id = $content.parent().parent().data('content-id').split('-').pop();
						me.property('tabs')[id]['title'] = $content.text();
						Upfront.Events.trigger('upfront:element:edit:stop');
					 }).on("blur", function() {
						$content.data('ueditor').stop(); 
					 })
					;
					$content.data('ueditor').stop();
					count++;
				});

				var $tabs = this.$el.find(".tab-content");
				
				$tabs.each(function () {
					var $content = $(this);
					$content.ueditor({
						//linebreaks: false,
						inserts: {},
						autostart: false
					})
						.on("start", function () {
							Upfront.Events.trigger('upfront:element:edit:start', 'text');
						})
						.on("stop", function () {
							me.saveTabContent();
							Upfront.Events.trigger('upfront:element:edit:stop');
							me.render();
						})
					;
				});

			$upfrontObjectContent = this.$el.find('.upfront-object-content');
			    if(this.$el.find('a.add-item').length < 1)
				      $('<b class="upfront-entity_meta add_item"><a href="#" class="upfront-icon-button add-item"></a></b>').insertBefore($upfrontObjectContent);
			

			this.$el.find('div#'+this.currenttabid).addClass('tab-content-active').siblings().removeClass('tab-content-active');
					  
			this.$el.find('div.tabs-tab[data-content-id="'+this.$el.find('div.tab-content-active').attr('id')+'"]').addClass('tabs-tab-active');
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
				if(typeof value != "undefined"){
					if(typeof silent == "undefined")
						silent = true;
					return this.model.set_property(name, value, silent);
				}
				return this.model.get_property_value_by_name(name);
			}
		});

		var TabsElement = Upfront.Views.Editor.Sidebar.Element.extend({
			priority: 100,
			render: function () {
				this.$el.addClass('upfront-icon-element upfront-icon-element-tabs');
				this.$el.html('Tabs');
			},
			add_element: function () {
				var object = new UtabsModel(),
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c9 upfront-tabs_module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(225)}
					],
					"objects": [
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
				return "Tabs settings";
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
						title: "Display style",
						fields: [
							/*
							 * new Upfront.Views.Editor.Field.Radios({
							 *   className: 'inline-radios',
							 *   model: this.model,
							 *   property: 'style_type',
							 *   label: "",
							 *   values: [
							 *     { label: "", value: 'theme_defined' },
							 *     { label: "", value: 'custom' }
							 *   ]
							 * }),
							 */
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'theme_style',
								label: "Theme Styles",
								values: [
									{ label: "Tabbed", value: 'tabbed' },
									{ label: "Simple text", value: 'simple_text' },
									{ label: "Button Tabs", value: 'button_tabs' },
								]
							}),
							/*
							 * new Upfront.Views.Editor.Field.Select({
							 *   model: this.model,
							 *   property: 'custom_style',
							 *   label: "Custom",
							 *   values: [
							 *     { label: "Tabbed", value: 'tabbed' },
							 *     { label: "Simple text", value: 'simple_text' },
							 *     { label: "Button Tabs", value: 'button_tabs' },
							 *   ]
							 * }),
							 * new Upfront.Views.Editor.Field.Color({
							 *   className: 'upfront-field-wrap upfront-field-wrap-color sp-cf tab-color',
							 *   model: this.model,
							 *   property: 'active_tab_color',
							 *   label: 'Active tab:',
							 *   spectrum: {
							 *     preferredFormat: "hsl",
							 *     change: this.onActiveTabColorChange
							 *   }
							 * }),
							 * new Upfront.Views.Editor.Field.Color({
							 *   className: 'upfront-field-wrap upfront-field-wrap-color sp-cf text-color',
							 *   model: this.model,
							 *   property: 'active_tab_text_color',
							 *   label: 'Active tab text:',
							 *   spectrum: {
							 *     preferredFormat: "hsl",
							 *     change: this.onActiveTabTextColorChange
							 *   }
							 * }),
							 * new Upfront.Views.Editor.Field.Color({
							 *   className: 'upfront-field-wrap upfront-field-wrap-color sp-cf tab-color',
							 *   model: this.model,
							 *   property: 'inactive_tab_color',
							 *   label: 'Inactive tab:',
							 *   spectrum: {
							 *     preferredFormat: "hsl",
							 *     change: this.onInactiveTabColorChange
							 *   }
							 * }),
							 * new Upfront.Views.Editor.Field.Color({
							 *   className: 'upfront-field-wrap upfront-field-wrap-color sp-cf text-color',
							 *   model: this.model,
							 *   property: 'inactive_tab_text_color',
							 *   label: 'Inactive tab text:',
							 *   spectrum: {
							 *     preferredFormat: "hsl",
							 *     change: this.onInactiveTabTextColorChange
							 *   }
							 * })
							 */
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
				return 'Appearance';
			},

			get_title: function () {
				return false;
			},

			property: function(name, value, silent) {
				if(typeof value != "undefined"){
					if(typeof silent == "undefined")
						silent = true;
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

		Upfront.Application.LayoutEditor.add_object("Utabs", {
			"Model": UtabsModel,
			"View": UtabsView,
			"Element": TabsElement,
			"Settings": TabsSettings,
			'anchor': {
				is_target: false
			}
		});

		Upfront.Models.UtabsModel = UtabsModel;
		Upfront.Views.UtabsView = UtabsView;

	}); //End require

})(jQuery);
