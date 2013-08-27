(function ($) {


    var AccordionModel = Upfront.Models.ObjectModel.extend({
        init: function () {
            this.init_property("type", "AccordionModel");
            this.init_property("view_class", "AccordionView");

            this.init_property("element_id", Upfront.Util.get_unique_id("upfront-accordion_element-object"));
            this.init_property("class", "c22 upfront-accordion_element-object");
            this.init_property("has_settings", 0);
        }
    });

    var AccordionView = Upfront.Views.ObjectView.extend({
        events: {
            'editor-change [contenteditable]': 'saveContent',
            'click .ui-accordion-header'  : 'EditTabs'
        },
        EditTabs: function(e){
            $(e.target).parent().find('div.ui-accordion-content').not($(e.target).next('div.ui-accordion-content')).slideUp();
            $(e.target).next('div.ui-accordion-content').slideDown();
        },
        get_content_markup: function () {
            return ['<div class="upfront-accordion" contenteditable="true">',
                this.model.get_content(), '</div>'].join('');
        },
        saveContent: function (event){
            this.model.set_content($(event.currentTarget).html(), {silent: true});
            event.stopPropagation(); // Only this view handles 'editor-change' of descendant contenteditables.
        },
        on_render: function(){
            var me = this;
            setTimeout(
                function() {
                    me.$el.find( ".accordion" ).accordion({
                        heightStyle: "content"
                    });
                }, 50);
        }
    });


    var AccordionElement = Upfront.Views.Editor.Sidebar.Element.extend({
        priority : 90,
        render: function () {
            this.$el.addClass('upfront-icon-element upfront-icon-element-accordion');
            this.$el.html('Accordion');
        },
        template: _.template('<div class="accordion"><h3>Section 1</h3><div><p>My awesome stub content goes here</p></div><h3>Section 2</h3><div><p>My awesome stub content goes here</p></div><h3>Section 3</h3><div><p>My awesome stub content goes here</p></div><h3>Section 4</h3><div><p>My awesome stub content goes here</p></div></div>'),
        add_element: function () {
            var object = new AccordionModel({
                    "name": "",
                    "properties": [
                        {"name": "content", "value": this.template()}
                    ]
                }),
                module = new Upfront.Models.Module({
                    "name": "",
                    "properties": [
                        {"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
                        {"name": "class", "value": "c15 upfront-accordion_element-module"},
                        {"name": "has_settings", "value": 0}
                    ],
                    "objects": [object]
                })
                ;
            this.add_module(module);
        }
    });

    Upfront.Application.LayoutEditor.add_object("Accordion", {
        "Model": AccordionModel,
        "View": AccordionView,
        "Element": AccordionElement
    });
    Upfront.Models.AccordionModel = AccordionModel;
    Upfront.Views.AccordionView = AccordionView;

})(jQuery);