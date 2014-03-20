(function ($) {

  define([
    'text!elements/upfront-tabs/tpl/utabs.html'
  ], function(tabsTpl) {
    var UtabsModel = Upfront.Models.ObjectModel.extend({
      init: function () {
        var properties = _.clone(Upfront.data.utabs.defaults);
        properties.element_id = Upfront.Util.get_unique_id("utabs-object");
        this.init_properties(properties);
      }
    });

    var UtabsView = Upfront.Views.ObjectView.extend({
      model: UtabsModel,
      tabsTpl: Upfront.Util.template(tabsTpl),
      elementSize: {width: 0, height: 0},

      initialize: function(){
        var me = this;
        if(! (this.model instanceof UtabsModel)){
          this.model = new UtabsModel({properties: this.model.get('properties')});
        }
        this.events = _.extend({}, this.events, {
          'click .add-tab': 'addTab',
          'click .tabs-tab': 'onTabClick',
          'keydown .tabs-tab[contenteditable=true]': 'onTabKeydown',
          'keydown .tab-content-active': 'onContentKeydown',
          'dblclick .tab-content-active': 'onContentDblclick',
          'click i': 'deleteTab'
        });
        this.delegateEvents();

        this.model.get("properties").bind("change", this.render, this);
        this.model.get("properties").bind("add", this.render, this);
        this.model.get("properties").bind("remove", this.render, this);

        Upfront.Events.on("entity:resize_stop", this.onResizeStop, this);
        this.on('deactivated', this.stopEdit, this);

        this.debouncedSave = _.debounce(this.saveTabContent, 1000);
      },

      addTab: function() {
        this.property('tabs').push({
          title: 'Tab ' + (1 + this.property('tabs_count')),
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

        if ($tab.hasClass('tabs-tab-active')) {
          $tab.attr('contenteditable', true);
          $tab.find('span').css('width', 'auto');
          $tab.focus();
          return;
        }

        $tab.addClass('tabs-tab-active');
        $tab.siblings().removeClass('tabs-tab-active').removeAttr('contenteditable');

        // If active content is edited save edits & destroy editor.
        if (this.$el.find('.tab-content-active').attr('contenteditable') === true) {
          this.stopEdit();
        }
        contentId = $tab.data('content-id');
        $('.tab-content').removeClass('tab-content-active');
        $('#' + contentId).addClass('tab-content-active');
      },

      onContentDblclick: function(event) {
        var $content = $(event.currentTarget);

        if ($content.attr('contenteditable') === true) return;

        $content.attr('contenteditable', true)
          .addClass('upfront-object');

        this.editor = CKEDITOR.inline($content[0]);
        $content.focus();
        this.$el.parent().parent().parent().draggable('disable');
      },

      onContentKeydown: function(event) {
        this.debouncedSave();
      },

      saveTabContent: function() {
        var $content = this.$el.find('.tab-content-active');
        var tabId = $content.attr('id').split('-').pop();
        this.property('tabs')[tabId].content = $content.html();
      },

      stopEdit: function() {
        this.saveTabContent();
        this.$el.find('.tab-content-active')
          .removeAttr('contenteditable')
          .removeClass('upfront-object');
        if (this.editor && this.editor.destroy) this.editor.destroy();
        this.$el.parent().parent().parent().draggable('enable');
        this.delegateEvents();
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
            $(event.currentTarget).append('<i>x</i>');
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
      },

      addTooltips: function() {
        $('.tabs-tab').each(function() {
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
      initialize: function () {
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
      initialize: function () {
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
