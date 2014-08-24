(function ($) {

define(['text!' + 'elements/upfront-accordion/tpl/uaccordion.html'], function(accordionTpl) {

	var l10n = Upfront.Settings.l10n.accordion_element;
		
	var UaccordionModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.uaccordion.defaults);
			
			var defaults = Upfront.data.uaccordion.defaults;

			//copy the default panel data by value, so that the source does not get updated if passed by reference

			properties['accordion'] = [];
			properties['accordion'][0] = {};
			properties['accordion'][0]['content'] = _.clone(defaults['accordion'][0]['content']);
			properties['accordion'][0]['title'] = _.clone(defaults['accordion'][0]['title']);
			
			properties['accordion'][1] = {};
			properties['accordion'][1]['content'] = _.clone(defaults['accordion'][1]['content']);
			properties['accordion'][1]['title'] = _.clone(defaults['accordion'][1]['title']);
		
			properties.element_id = Upfront.Util.get_unique_id("uaccordion-object");
			this.init_properties(properties);
		}
	});

	var UaccordionView = Upfront.Views.ObjectView.extend({
		model: UaccordionModel,
		currentEditItem: '',
		accordionTpl: Upfront.Util.template(accordionTpl),
		elementSize: {width: 0, height: 0},

		cssSelectors: {
			'.accordion-panel': {label: l10n.css.containers_label, info: l10n.css.containers_info},
			'.accordion-panel-title': {label: l10n.css.header_label, info: l10n.css.header_info},
			'.accordion-panel-content': {label: l10n.css.body_label, info: l10n.css.body_info},
			'.accordion-panel:first-of-type' : {label: l10n.css.first_label, info: l10n.css.first_info},
			'.accordion-panel:last-child' : {label: l10n.css.last_label, info: l10n.css.last_info},
			'.accordion-panel:nth-child(2n+3)' : {label: l10n.css.odd_label, info: l10n.css.odd_info},
			'.accordion-panel:nth-child(2n)' : {label: l10n.css.even_label, info: l10n.css.even_info}
		},

		initialize: function(){
			var me = this;
			if(! (this.model instanceof UaccordionModel)){
				this.model = new UaccordionModel({properties: this.model.get('properties')});
			}
			this.events = _.extend({}, this.events, {
				'click .accordion-add-panel': 'addPanel',
				'click .accordion-panel-title': 'onPanelTitleClick',
				'dblclick .accordion-panel-active .accordion-panel-content': 'onContentDblclick',
				'click i': 'deletePanel'
			});
			this.delegateEvents();

			this.model.get("properties").bind("change", this.render, this);
			this.model.get("properties").bind("add", this.render, this);
			this.model.get("properties").bind("remove", this.render, this);


			//this.on('deactivated', this.onDeactivate, this);
			Upfront.Events.on("entity:deactivated", this.stopEdit, this);
		},
		stopEdit: function(e) {
				
			
			var $panelcontent = this.$el.find('.accordion-panel-active .accordion-panel-content');
			$panelcontent.trigger('blur');

			var $paneltitle = this.$el.find('.accordion-panel-active .accordion-panel-title:not(.ueditor-placeholder)');
			$paneltitle.trigger('blur');
			
			
		
		},
		addPanel: function(event) {
			event.preventDefault();
			this.property('accordion').push({
				title: 'Panel ' + (1 + this.property('accordion_count')),
				content: 'Content ' + (1 + this.property('accordion_count'))
			});
			this.property('accordion_count', this.property('accordion').length, false);
		},

		deletePanel: function(event) {
			var element = $(event.currentTarget);
			var panel = element.parents('.accordion-panel');
			var id = panel.index()-1;
			this.property('accordion').splice(id, 1);
			this.property('accordion_count', this.property('accordion_count') - 1, false);
		},



		onPanelTitleClick: function(event) {
			var $panelTitle = $(event.currentTarget);
			if($panelTitle.parent().hasClass('accordion-panel-active')) {
				if($panelTitle.data('ueditor')) $panelTitle.data('ueditor').start();
			} else {
				this.$el.find('.accordion-panel-content').each(function () {
					var ed = $(this).data("ueditor");
					if (ed) ed.stop();
				});
				$panelTitle.parent().addClass('accordion-panel-active').find('.accordion-panel-content').slideDown();
				$panelTitle.parent().siblings().removeClass('accordion-panel-active').find('.accordion-panel-content').slideUp();
			}
		},

		onContentDblclick: function(event) {
			if($(event.target).data('ueditor')) $(event.target).data('ueditor').start();
			else event.stopPropagation();
		},

		saveTitle: function(target) {
			id = target.closest('div.accordion-panel').index()-1;
			this.property('accordion')[id].title = target.html();
		},

		savePanelContent: function() {
			var panel = this.$el.find('.accordion-panel-active'),
				$content = panel.find('.accordion-panel-content'),
				panelId = panel.index()-1,
				ed = $content.data("ueditor"),
				text = ''
			;
			try { text = ed.getValue(true); } catch (e) { text = ''; }

			this.property('accordion')[panelId].content = text || $content.html();
			if (text) {
				this.render();
			}
		},


		get_content_markup: function () {
			return this.accordionTpl(
				_.extend(
					this.extract_properties(),
					{
						show_add: true,
						show_remove: this.property('accordion_count') > 1 ? true : false
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

		on_render: function() {
			// Accordion won't be rendered in time if you do not delay.
			//_.delay(function(self) {
				
			//	, 10, this);
			var count = 1;
			var self = this;
			this.$el.find('.accordion-panel-title').each(function() {
				if ($(this).data("ueditor")) return true;
				var $content = $(this);
				$(this).ueditor({
					linebreaks: true,
					disableLineBreak: true,
					//focus: true,
					//autostart: false,
					//tabFocus: false,
					airButtons: false,
					allowedTags: ['h5'],
					placeholder: 'Panel '+count
				}).on('start', function(){
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
					if (e.which == 9) e.preventDefault();
				}).on("blur", function() {
					$content.data('ueditor').stop(); 
				});
				
				$(this).data('ueditor').stop();
				count++;
			});
			self.$el.find('.accordion-panel-content').each(function() {
				if ($(this).data("ueditor")) return true;
				$(this).ueditor({
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
					$(this).data('ueditor').stop();
				});
			});
			self.$el.find('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();
			
			this.$el.find('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();

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
			if(typeof value != "undefined"){
				if(typeof silent == "undefined")
					silent = true;
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		}
	});

		var AccordionElement = Upfront.Views.Editor.Sidebar.Element.extend({
			priority: 200,
			render: function () {
				this.$el.addClass('upfront-icon-element upfront-icon-element-accordion');
				this.$el.html(l10n.element_name);
			},
			add_element: function () {
				var object = new UaccordionModel(),
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c9 upfront-accordion_module"},
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

		var AccordionSettings = Upfront.Views.Editor.Settings.Settings.extend({
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
			className: 'uaccordion-settings-panel',
			initialize: function (opts) {
				this.options = opts;
				var render_all,
					me = this;

				render_all = function(){
					this.settings.invoke('render');
				};
				_.bindAll(this, 'onHeaderBorderChange', 'onHeaderBgChange', 'onPanelBgChange');

				this.model.on('doit', render_all, this);

				this.settings = _([
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: l10n.appearance,
						fields: [
							// new Upfront.Views.Editor.Field.Radios({
							// 	className: 'inline-radios',
							// 	model: this.model,
							// 	property: 'style_type',
							// 	label: "",
							// 	values: [
							// 		{ label: "", value: 'theme_defined' },
							// 		{ label: "Custom", value: 'custom' }
							// 	]
							// }),
							// new Upfront.Views.Editor.Field.Select({
							// 	model: this.model,
							// 	property: 'theme_style',
							// 	label: "Theme Styles",
							// 	values: [
							// 		{ label: "Style 1", value: 'style1' },
							// 		{ label: "Style 2", value: 'style2' },
							// 		{ label: "Style 3", value: 'style3' },
							// 	]
							// }),
							new Upfront.Views.Editor.Field.Color({
								className: 'upfront-field-wrap upfront-field-wrap-color sp-cf panel-bg-color',
								model: this.model,
								property: 'panel_bg_color',
								label: l10n.section_bg,
								spectrum: {
									preferredFormat: "hsl",
									change: this.onPanelBgChange,
									move: this.onPanelBgChange
								}
							}),
							new Upfront.Views.Editor.Field.Color({
								className: 'upfront-field-wrap upfront-field-wrap-color sp-cf header-bg-color',
								model: this.model,
								property: 'header_bg_color',
								label: l10n.header_bg,
								spectrum: {
									preferredFormat: "hsl",
									change: this.onHeaderBgChange,
									move: this.onHeaderBgChange
								}
							}),
							new Upfront.Views.Editor.Field.Color({
								className: 'upfront-field-wrap upfront-field-wrap-color sp-cf header-border-color',
								model: this.model,
								property: 'header_border_color',
								label: l10n.header_border,
								spectrum: {
									preferredFormat: "hsl",
									change: this.onHeaderBorderChange,
									move: this.onHeaderBorderChange
								}
							})
						]
					})
				]);
				
				// this.$el .on('change', 'input[name=style_type]', function(e){
				// 	me.onStyleTypeChange(e);
				// });
				// this.$el .on('change', 'input[name=theme_style]', function(e){
				// 	me.onThemeStyleChange(e);
				// });
				
				/**
				 * Set style to custom as default
				 */
				this.property('style_type', "custom");
			},

			onStyleTypeChange: function(event) {
				this.property('style_type', $(event.currentTarget).val(), false);
				this.setColorChooserVisibility();
			},

			onThemeStyleChange: function(event) {
				this.property('theme_style', $(event.currentTarget).val(), false);
			},

			onHeaderBorderChange: function(event) {
				this.property('header_border_color', event.toHslString(), false);
			},

			onHeaderBgChange: function(event) {
				this.property('header_bg_color', event.toHslString(), false);
			},

			onPanelBgChange: function(event) {
				this.property('panel_bg_color', event.toHslString(), false);
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

		Upfront.Application.LayoutEditor.add_object("Uaccordion", {
			"Model": UaccordionModel,
			"View": UaccordionView,
			"Element": AccordionElement,
			"Settings": AccordionSettings,
			'anchor': {
				is_target: false
			}
		});

		Upfront.Models.UaccordionModel = UaccordionModel;
		Upfront.Views.UaccordionView = UaccordionView;

}); //End require

})(jQuery);
