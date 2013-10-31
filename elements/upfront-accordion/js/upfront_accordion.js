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
            'click .ui-accordion-header'  : 'edit_panels',
            'click .add_new_panel'  : 'add_new_panel',
            'click .remove_panel'  : 'delete_panel',
            'hover .accordion h3'  : 'hover_panel',
            'hover .remove_panel'  : 'show_this'
        },
        edit_panels: function(e){
            $(e.target).parent().find('div.ui-accordion-content').not($(e.target).next('div.ui-accordion-content')).slideUp();
            $(e.target).next('div.ui-accordion-content').slideDown();
        },
        delete_panel: function(e){
            e.preventDefault();
            var id = parseInt($(e.target).attr('data-id'), 10),
                 headers = this.$el.find('.accordion h3');
            $(headers[id]).next('div').remove().end().remove();
            $(e.target).remove();
            this.$el.find('.accordion').accordion('destroy').accordion();
            this.append_removes();
        },
        add_new_panel: function(e){
            e.preventDefault();
            var index = this.$el.find('.accordion h3').length + 1;
            this.$el.find('.accordion').accordion();
            var new_panel = '<h3>Section '+index+'</h3><div><p>My awesome stub content goes here</p></div>'
            this.$el.find('.accordion').append(new_panel).accordion('destroy').accordion();
            this.$el.find('.upfront-object-content').append('<a href="#" data-id="'+(index-1)+'" class="remove_panel">x Remove</a>');
        },
        show_this: function(e){
            if (e.type == "mouseenter") {
                $(e.target).show()
            }
            else {
                $(e.target).hide();
            }
        },
        hover_panel: function(e){
            this.set_delete_button_position();
            var myString = e.target.id,
                parts = myString.split("-"),
                thePart = parts[4],
                id = parseInt(thePart, 10),
                remove = this.$el.find('.remove_panel[data-id="'+id+'"]');
            if (e.type == "mouseenter") {
                remove.show();
            }
            else {
                remove.hide();
            }
            this.set_delete_button_position();
        },
        set_delete_button_position: function(){
            var me = this,
                removes = this.$el.find('.remove_panel');
            if(!removes.length)
                return false;
            removes.each(function(){
                var id = parseInt($(this).attr('data-id'), 10),
                    headers = me.$el.find('.accordion h3'),
                    position, top, left, width;
                position = $(headers[id]).position(),
                width = $(headers[id]).width(),
                top = position.top,
                left = position.left + (width - 70);
                $(this).css({'top': top, 'left': left});
            });
        },
        get_content_markup: function () {
            return ['<div class="upfront-accordion" contenteditable="true">',
                this.model.get_content(), '</div>'].join('');
        },
        saveContent: function (event){
            this.model.set_content($(event.currentTarget).html(), {silent: true});
            event.stopPropagation(); // Only this view handles 'editor-change' of descendant contenteditables.
        },
        append_removes: function(){
            this.$el.find('.upfront-object-content .remove_panel').remove();
            var index = this.$el.find('.accordion h3').length;
            for (var i=0; i<index; i++)
            {
                this.$el.find('.upfront-object-content').append('<a href="#" data-id="'+i+'" class="remove_panel">x Remove</a>');
            }
        },
        on_render: function(){
            var me = this;
            setTimeout(
                function() {
                    me.$el.find( ".accordion" ).accordion({
                        heightStyle: "content"
                    });
                }, 50);
            this.append_removes();
            this.$el.append('<a href="#" class="add_new_panel">+ Add New Panel</a>');
        }
    });


    var AccordionElement = Upfront.Views.Editor.Sidebar.Element.extend({

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
                        {"name": "has_settings", "value": 0},
						{"name": "row", "value": 23}
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