(function ($) {

  /*var templates = [
    'text!' + Upfront.data.uaccordion.template ];*/

  define(['text!' + 'elements/upfront-accordion/tpl/uaccordion.html'], function(accordionTpl) {
    var UaccordionModel = Upfront.Models.ObjectModel.extend({
      init: function () {
        var properties = _.clone(Upfront.data.uaccordion.defaults);
        properties.element_id = Upfront.Util.get_unique_id("uaccordion-object");
        this.init_properties(properties);
      }
    });

    var UaccordionView = Upfront.Views.ObjectView.extend({
      model: UaccordionModel,
	  currentEditItem: '',
      accordionTpl: Upfront.Util.template(accordionTpl),
      elementSize: {width: 0, height: 0},
      initialize: function(){
        var me = this;
        if(! (this.model instanceof UaccordionModel)){
          this.model = new UaccordionModel({properties: this.model.get('properties')});
        }
        this.events = _.extend({}, this.events, {
          'click .accordion-add-panel': 'addPanel',
          'click .accordion-panel-title': 'onPanelTitleClick',
          'keydown .accordion-panel-active .accordion-panel-content': 'onContentKeydown',
          'dblclick .accordion-panel-active .accordion-panel-content': 'onContentDblclick',
          'click i': 'deletePanel'
        });
        this.delegateEvents();

        this.model.get("properties").bind("change", this.render, this);
        this.model.get("properties").bind("add", this.render, this);
        this.model.get("properties").bind("remove", this.render, this);


        this.on('deactivated', this.onDeactivate, this);

        this.debouncedSave = _.debounce(this.savePanelContent, 1000);
      },

      addPanel: function() {
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
		
		if((typeof currentEditItem != 'undefined') && currentEditItem != '' && currentEditItem != $panelTitle.attr('id')) {

			this.onDeactivate();
		}
		
		if ($panelTitle.parent().hasClass('accordion-panel-active') &&  $panelTitle.attr('contenteditable') == 'true')
		return;
		


		
        if ($panelTitle.parent().hasClass('accordion-panel-active')) {
          $panelTitle.attr('contenteditable', true);

			/*var editor = Upfront.Content.editors.add({
			type: Upfront.Content.TYPES.SIMPLE,
			editor_id: $panelTitle.attr('id'),
			element: '#'+$panelTitle.attr('id'),
			});*/
			
			if(!$('#'+$panelTitle.attr('id')).data('ueditor')) {

			
			var editor = $('#'+$panelTitle.attr('id')).ueditor({
					autostart: false,
					upfrontMedia: false,
					upfrontImages: false
				});
			editor.on('syncAfter', function(){
					console.log('syncing after');
					self.saveTitle($panelTitle);
					self.$el.parent().parent().parent().draggable('enable');
					editor.stop();
				})
			}
			currentEditItem = $panelTitle.attr('id');

		   //editor.start();
		   
		  // var deditor = CKEDITOR.instances[currentEditItem];
		   
		   var self = this;
		   
			/*editor.on( 'textcolor:change', function(color) {
				var value = color.toRgbString();
				$panelTitle.css('color', value);
				self.saveTitle($panelTitle);
			});
			
			editor.on( 'panelcolor:change', function(color) {
				var value = color.toRgbString();
				$panelTitle.css('background-color', value);
				self.saveTitle($panelTitle);
			});
			
			editor.on('change', function (e) {
				self.saveTitle($panelTitle);
			});
			
			deditor.on( 'key', function(key) {
				if(key.data['keyCode'] == 13) {
					self.onDeactivate();
					return false;
				}
			});
			deditor.on('saveSnapshot', function (e) {
				self.saveTitle($panelTitle);
			});
			
			deditor.on('afterCommandExec', function (e) {
				self.saveTitle($panelTitle);
			});
			*/
			
          $panelTitle.focus();
		  this.$el.parent().parent().parent().draggable('disable');
          return;
        }

        $panelTitle.parent().addClass('accordion-panel-active').find('.accordion-panel-content').show('normal');
        $panelTitle.parent().siblings().removeClass('accordion-panel-active').find('.accordion-panel-content').hide('normal');
		$panelTitle.removeAttr('contenteditable');
		


      },

		onDeactivate: function() {

				
			var target = $('#'+currentEditItem);
			if(target.hasClass('accordion-panel-title')) {
				target.removeAttr('contenteditable');
				this.saveTitle(target);
				//var editor = Upfront.Content.editors.get(currentEditItem);
				//editor.stop();
				console.log('saved title content');
		        this.$el.parent().parent().parent().draggable('enable');
			}
			else if(target.hasClass('accordion-panel-content')) {
				this.stopEdit();
			}
			
			
			
			$('#'+currentEditItem).removeAttr('contenteditable');
			currentEditItem = '';
		},

      onContentDblclick: function(event) {

		var $content = $(event.currentTarget);
		
		if((typeof currentEditItem != 'undefined') && currentEditItem != '' && currentEditItem != $content.attr('id')) {
			this.onDeactivate();
		}

        
		
        if ($content.attr('contenteditable') === 'true') return;

        $content.attr('contenteditable', true).addClass('upfront-object');
        
		
		//this.editor = CKEDITOR.inline($content[0]);
		if(!$content.data('ueditor')) {

		
			var editor = $content.ueditor({
				autostart: false,
			});
			editor.on('syncAfter', function(){
				console.log('syncing after');
				self.savePanelContent();
				self.stopEdit();
				editor.stop();
			})
		}
		
		currentEditItem = $content.attr('id');

		self = this;
		
		/*this.editor.on('saveSnapshot', function (e) {
			self.savePanelContent();
			console.log("savesnapshot fired");
		});
		
		this.editor.on('afterCommandExec', function (e) {
			self.savePanelContent();
			console.log("afterCommandExec fired");
		});
		*/
		$content.focus();

        this.$el.parent().parent().parent().draggable('disable');
      },

      onContentKeydown: function(event) {
        this.debouncedSave();
      },
	  
		saveTitle: function(target) {
			return;			
			id = target.parent().index()-1;
			this.property('accordion')[id].title = target.html();
			this.property('accordion')[id].title_color = target.css('color');
			this.property('accordion')[id].title_bgcolor = target.css('background-color');
		},
		
      savePanelContent: function() {
        var panel = this.$el.find('.accordion-panel-active');
		var $content = panel.find('.accordion-panel-content');
        var panelId = panel.index()-1;
        this.property('accordion')[panelId].content = $content.html();
		
      },
	  
      stopEdit: function() {

        this.savePanelContent();
        this.$el.find('.accordion-panel-active .accordion-panel-content')
          .removeAttr('contenteditable')
          .removeClass('upfront-object');
       // if (this.editor && this.editor.destroy) this.editor.destroy();
		console.log('saved content');
        this.$el.parent().parent().parent().draggable('enable');
        this.delegateEvents();
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
       _.delay(function(self) {

          self.$el.find('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();
	
        }, 10, this);
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
        this.$el.html('Accordion');
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
      initialize: function () {
        this.panels = _([
          new AppearancePanel({model: this.model})
        ]);
      },

      get_title: function () {
        return "Accordion settings";
      }
    });

    var AppearancePanel = Upfront.Views.Editor.Settings.Panel.extend({
      className: 'uaccordion-settings-panel',
      initialize: function () {
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
            title: "Display style",
            fields: [
              new Upfront.Views.Editor.Field.Radios({
                className: 'inline-radios',
                model: this.model,
                property: 'style_type',
                label: "",
                values: [
                  { label: "", value: 'theme_defined' },
                  { label: "Custom", value: 'custom' }
                ]
              }),
              new Upfront.Views.Editor.Field.Select({
                model: this.model,
                property: 'theme_style',
                label: "Theme Styles",
                values: [
                  { label: "Style 1", value: 'style1' },
                  { label: "Style 2", value: 'style2' },
                  { label: "Style 3", value: 'style3' },
                ]
              }),
              new Upfront.Views.Editor.Field.Color({
                className: 'upfront-field-wrap upfront-field-wrap-color sp-cf header-border-color',
                model: this.model,
                property: 'header_border_color',
                label: 'Header Border:',
                spectrum: {
                  preferredFormat: "hsl",
                  change: this.onHeaderBorderChange
                }
              }),
              new Upfront.Views.Editor.Field.Color({
                className: 'upfront-field-wrap upfront-field-wrap-color sp-cf header-bg-color',
                model: this.model,
                property: 'header_bg_color',
                label: 'Header Background:',
                spectrum: {
                  preferredFormat: "hsl",
                  change: this.onHeaderBgChange
                }
              }),
              new Upfront.Views.Editor.Field.Color({
                className: 'upfront-field-wrap upfront-field-wrap-color sp-cf panel-bg-color',
                model: this.model,
                property: 'panel_bg_color',
                label: 'Section Background:',
                spectrum: {
                  preferredFormat: "hsl",
                  change: this.onPanelBgChange
                }
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
