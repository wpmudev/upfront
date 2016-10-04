(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-draggable-elements'
    ], function (SidebarPanel_DraggableElements) {

        return SidebarPanel_DraggableElements.extend({
            className: "sidebar-panel upfront-panel-post_panel",
            parts: ['Title', 'Contents', 'Excerpt', 'Featured Image', 'Author', 'Author Gravatar', 'Date', 'Update', 'Comments Count', 'Tags', 'Categories'],
            partElements: [],
            initialize: function (opts) {
                //SidebarPanel_DraggableElements.prototype.constructor.call(this, opts);
                this.active = false;
                this.elements = _([]);
                Upfront.Events.on("entity:drag_stop", this.reset_modules, this);
                Upfront.Events.on("layout:render", this.apply_state_binding, this);
            },
            get_title: function () {
                return l10n.post_components;
            },

            loadElements: function(){
                this.elements =  _([]);

                var me = this,
                    PostPartElement = Upfront.Content.PostElement,
                    editorObjects = Upfront.Application.LayoutEditor.Objects
                    ;

                _.each(this.parts, function(part){
                    var element = new PostPartElement({title: part, model: Upfront.Application.layout}),
                        elementSlug = 'PostPart_' + element.slug
                        ;

                    me.elements.push(element);
                    if(!editorObjects[elementSlug]){
                        editorObjects[elementSlug] = {
                            Model: element.Model,
                            View: element.View,
                            Element: PostPartElement,
                            Settings: element.Settings
                        };

                        Upfront.Models[elementSlug + 'Model'] = element.Model;
                        Upfront.Views[elementSlug + 'View'] = element.View;
                    }

                    me.partElements.push(element);
                });

                Upfront.Events.trigger('sidebar:postparts:loaded');

                return this;
            },

            unloadElements: function(){
                var me = this,
                    editorObjects = Upfront.Application.LayoutEditor.Objects
                    ;

                _.each(this.partElements, function(element){
                    var elementSlug = 'PostPart_' + element.slug;
                    element.remove();
                    delete(editorObjects[elementSlug]);
                    delete(Upfront.Models[elementSlug + 'Model']);
                    delete(Upfront.Views[elementSlug + 'View']);
                });

                this.partElements = [];


                Upfront.Events.trigger('sidebar:postparts:unloaded');

                return this;
            }
        });

    });
}(jQuery));