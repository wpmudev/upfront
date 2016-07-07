(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command-new-post',
        'scripts/upfront/upfront-views-editor/fields'
    ], function ( Command_NewPost, Fields ) {

        return Command_NewPost.extend({
            "className": "command-new-page",
            postType: 'page',
            _default_label: l10n.new_page,
            initialize: function () {
                this.setMode = Upfront.Application.MODE.LAYOUT;
            },
            render: function () {
                Upfront.Events.trigger("command:newpage:start", true);
                // this.$el.addClass('upfront-icon upfront-icon-page');
                this.$el.html(this._default_label);
                this.$el.prop("title", this._default_label);
            },
            on_click: function(e){
                e.preventDefault();
                var me = this;

                Upfront.Util
                    .post({
                        action: "upfront-create-post_type",
                        data: _.extend({post_type: me.postType, title: me._default_label}, {})
                    }).done(function (resp) {
                    if(_upfront_post_data) _upfront_post_data.post_id = resp.data.post_id;
                    Upfront.Application.navigate('/edit/page/' + resp.data.post_id, {trigger: true});
                    Upfront.Events.trigger("click:edit:navigate", resp.data.post_id);
                })
                ;
            },
            render_modal: function () {
                var me = this,
                    $content = this.modal.$el.find('.upfront-inline-modal-content')
                    ;
                $content
                    .empty()
                    .append('<h2>' + l10n.add_new_page + '</h2>')
                ;
                _.each(me.modal._fields, function (field) {
                    field.render();
                    field.delegateEvents();
                    $content.append(field.$el);
                });
            },
            spawn_modal: function () {
                if (this.modal) return this.initialize_modal_data();
                var me = this,
                    update_modal_data = function () {
                        _.each(me.modal._fields, function (field, key) {
                            me.modal._data[key] = field.get_value();
                        });
                        if (!me.modal._fields.permalink.has_been_edited()) {
                            var title = $.trim(me.modal._data.title || me._default_label),
                                permalink = title
                                    .replace(/^[^a-z0-9]+/gi, '') // Trim non-alnum off of start
                                    .replace(/[^a-z0-9]+$/gi, '') // Trim non-alnum off of end
                                    .replace(/[^-_0-9a-z]/gi, '-')
                                    .toLowerCase()
                                ;
                            me.modal._fields.permalink.set_value(permalink);
                        }
                    },
                    _initial_templates = [{label: l10n.none, value: ""}],
                    templates_request = Upfront.Util.post({
                        action: "upfront-wp-model",
                        model_action: "get_post_extra",
                        postId: "fake", // Stupid walkaround for model handler insanity
                        allTemplates: true
                    })
                    ;
                this.modal = new Upfront.Views.Editor.Modal({to: $('body'), button: true, top: 120, width: 540, button_text: l10n.create_page});
                this.modal._fields = {
                    title: new Upfront.Views.Editor.Field.Text({
                        label: "",
                        name: "title",
                        default_value: this._default_label,
                        change: update_modal_data
                    }),
                    permalink: new Fields.ToggleableText({
                        label: '<b>' + l10n.permalink + ':</b> ' + Upfront.Settings.site_url.replace(/\/$/, '') + '/',
                        label_style: "inline",
                        name: "permalink",
                        change: update_modal_data
                    }),
                    template: new Upfront.Views.Editor.Field.Select({
                        label: l10n.page_template,
                        name: "template",
                        values: _initial_templates
                    })
                };
                this.initialize_modal_data();
                this.on("new_page:modal:open", update_modal_data, this);
                this.on("new_page:modal:close", update_modal_data, this);
                templates_request.done(function (response) {
                    me.modal._fields.template.options.values = _initial_templates; // Zero out the templates selection
                    if (!response.data || !response.data.allTemplates) return false;
                    _.each(response.data.allTemplates, function (tpl, title) {
                        me.modal._fields.template.options.values.push({label: title, value: tpl});
                    });
                    me.modal._fields.template.render();
                });
            },
            initialize_modal_data: function () {
                var me = this;
                this.modal._data = {};
                _.each(_.keys(this.modal._fields), function (key) {
                    me.modal._data[key] = "";
                    if (me.modal._fields[key].reset_state) me.modal._fields[key].reset_state();
                });

            }
        });

    });
}(jQuery));