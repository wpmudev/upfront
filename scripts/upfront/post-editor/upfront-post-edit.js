;(function($){define(["text!upfront/templates/post-editor/edition-box.html"], function(editionBox_tpl){

var Box = Backbone.View.extend({
    className: 'ueditor-box-wrapper upfront-ui',
    post: false,
    taxSection: false,
    offset: {min:0, max:0},
    position: {min:0, max:0},
    onScrollFunction: false,
    statusSelect: false,
    visibilitySelect: false,

    events: {
        'click .ueditor-action-preview': 'navigate_to_preview',
        'click .ueditor-action-cancel': 'cancel',
        'click .ueditor-action-publish': 'publish',
        'click .ueditor-action-draft': 'saveDraft',
        'click .ueditor-action-trash': 'trash',
        'click .ueditor-action-tags': 'editTaxonomies',
        'click .ueditor-box-title': 'toggle_section',
        'click .ueditor-save-post-data': 'save_post_data'
    },

    initialize: function(options){
        var me = this;
        this.post = options.post;


        this.statusSection = new PostStatusView({post: this.post});
        this.visibilitySection = new PostVisibilityView({post: this.post});
        this.scheduleSection = new PostScheduleView({post: this.post});
        this.urlEditor = new PostUrlEditor( { post: this.post } );

        this.tpl = _.template($(editionBox_tpl).find("#ueditor-box-main").html());
        this.datepickerTpl = _.template($(Upfront.data.tpls.popup).find('#datepicker-tpl').html());
        Upfront.Events.trigger('upfront:element:edit:start', 'write', this.post);

        Upfront.Events.on("upfront:element:edit:stop", this.element_stop_prop, this);
    },

    element_stop_prop: function () {
        if (
            Upfront.Application.mode.current === Upfront.Application.MODE.POSTCONTENT
            &&
            Upfront.Application.current_subapplication.contentEditor
        ) $('.upfront-module').draggable('disable').resizable('disable');
    },

    render: function(){
        this.destroy();
        if (!Upfront.Settings.Application.MODE.ALLOW.match(Upfront.Settings.Application.MODE.CONTENT)) return false; // Drop the entire bar rendering if we're unable to deal with it
        var me = this,
            postData = this.post.toJSON(),
            extraData = {},
            base = me.post.get("guid")
            ;

        extraData.rootUrl = base ? base.replace(/\?.*$/, '') : window.location.origin + '/';
        postData.permalink = this.permalink = extraData.rootUrl + this.post.get("post_name");
        postData.previewLink = this.post.get("guid") + "&preview=true";

        postData.buttonText = this.getButtonText();
        postData.draftButton = ['publish', 'future'].indexOf(this.initialStatus) == -1;
        postData.cancelButton = !(this.post.is_new);

        postData.cid = this.cid;

        this.$el.html(this.tpl(_.extend({}, postData, extraData) ));
        this.populateSections();
        return this;
    },
    navigate_to_preview: function(e){
        e.preventDefault();

        if( this.post.get("post_status") === "auto-draft" ){
            this.post.trigger('editor:auto-draft');
            this.trigger('auto-draft');
            window.open(this.post.get("guid") + "&preview=true", '_blank');
            return;
        }

        window.open(this.post.get("guid"), '_blank');
    },
    renderTaxonomyEditor: function($el, tax){
        var self = this,
            tax = typeof tax === "undefined" ? "category" : tax,
            termsList = new Upfront.Collections.TermList([], {postId: this.post.id, taxonomy: tax});
        termsList.fetch({allTerms: true}).done(function(response){
            var tax_view_constructor = response.data.taxonomy.hierarchical ? ContentEditorTaxonomy_Hierarchical : ContentEditorTaxonomy_Flat,
                tax_view = new tax_view_constructor({collection: termsList})
                ;

            tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);
            tax_view.render();
            $el.html( tax_view.$el );
        });

    },
    populateSections: function(){
        this.$('.misc-pub-post-status').html(this.statusSection.$el);
        this.$('.misc-pub-visibility').html(this.visibilitySection.$el);
        this.$('.misc-pub-schedule').html(this.scheduleSection.$el);

        this.$(".misc-pub-section.misc-pub-post-url").html( this.urlEditor.$el  );

        this.renderTaxonomyEditor( this.$(".misc-pub-post-category"), "category");
        this.renderTaxonomyEditor( this.$(".misc-pub-post-tags"), "post_tag");
    },

    getButtonText: function(){
        var initial = this.initialStatus,
            date = this.post.get('post_date'),
            now = new Date()
            ;

        date = date ? date.getTime() : 0;
        now = now.getTime();

        if(now < date) {
            if(initial == 'future')
                return Upfront.Settings.l10n.global.content.update;
            return Upfront.Settings.l10n.global.content.schedule;
        }
        else {
            if(initial == 'publish')
                return Upfront.Settings.l10n.global.content.update;
            return Upfront.Settings.l10n.global.content.publish;
        }
    },

    setPosition: function(){
        var $container = $(".upfront-output-this_post"),
            right_space = $("body").width() - ( $container.width() + ( _.isUndefined( $container.offset() ) ? 0 : $container.offset().left ) ),
            right = right_space > this.$el.width() ? right_space - this.$el.width() :  10
            ;

        this.$el.css({
            right: right + 10
        });

    },

    destroy: function(){
        //$(window)
        //    .off('scroll', this.onScrollFunction)
        //    .off('resize', this.onScrollFunction)
        //;
        //this.onScrollFunction = false;
    },

    cancel: function(e){
        e.preventDefault();
        if(confirm(Upfront.Settings.l10n.global.content.discard_changes.replace(/%s/, this.post.get('post_title')))){
            this.destroy();
            this.post.trigger('editor:cancel');
            this.trigger('cancel');
            Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
        }
    },

    publish: function(e){
        /*
         if(this.currentStatus == 'draft') return this.saveDraft(e); // Why? This is just asking for problems...
         */

        e.preventDefault();
        //this.destroy();

        this.post.trigger('editor:publish');
        this.trigger('publish');
        Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
        Upfront.Application.sidebar.toggleSidebar();
    },

    saveDraft: function(e){
        e.preventDefault();

        this.destroy();

        this.post.trigger('editor:draft');
        this.trigger('draft');
        Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
    },

    trash: function(e){
        e.preventDefault();
        if(confirm( Upfront.Settings.l10n.global.content.delete_confirm.replace(/%s/, this.post.get('post_type')))){
            this.destroy();
            this.trigger('trash');
            Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
        }
    },

    editTaxonomies: function(e, taxName){
        if(e)
            e.preventDefault();

        var me = this,
            tmp = $('body').append('<div id="upfront-post_taxonomies" style="display:none" />'),
            $tax = $("#upfront-post_taxonomies"),
            $popup = {},
            views = {category: false, post_tag: false},
            currentView = taxName || 'category',
            terms = {},
            popup = Upfront.Popup.open(function (data, $top, $bottom) {
                var $me = $(this);
                $me.empty()
                    .append('<p class="upfront-popup-placeholder">' + Upfront.Settings.l10n.global.content.popup_loading + '</p>')
                    .append($tax)
                ;
                $popup = {
                    "top": $top,
                    "content": $me,
                    "bottom": $bottom
                };
            }),
            dispatch_taxonomy_call = function (el) {
                var $el = $(el),
                    tax = $el.attr("data-type"),
                    type = $el.attr('rel'),
                    termsList = terms[tax] ? terms[tax] : false
                    ;
                $popup.top.find('.upfront-tabs li').removeClass('active');
                $el.addClass('active');

                currentView = tax;

                if(views[tax])
                    return render_panel(views[tax]);

                if(!termsList){
                    termsList = new Upfront.Collections.TermList([], {postId: me.post.id, taxonomy: tax});
                    terms[tax] = termsList;
                }

                $popup.content.html('<p class="upfront-popup-placeholder">' + Upfront.Settings.l10n.global.content.popup_loading + '</p>');

                termsList.fetch({allTerms: true}).done(function(response){
                    var tax_view_constructor = response.data.taxonomy.hierarchical ? ContentEditorTaxonomy_Hierarchical : ContentEditorTaxonomy_Flat,
                        tax_view = new tax_view_constructor({collection: termsList})
                        ;

                    tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);

                    views[tax] = tax_view;
                    render_panel();
                });

                me.listenToOnce(Upfront.Events, 'popup:closed', me.refreshTaxonomies);

                return false;
            },
            render_panel = function(view){
                var v = views[currentView];
                v.render();
                $popup.content.html(v.$el);
                v.setElement(v.$el);
            }
            ;

        $(".upfront-popup-placeholder").remove();
        $popup.top.html(
            '<ul class="upfront-tabs">' +
            '<li data-type="category" class="tax-category">' + Upfront.Settings.l10n.global.content.categories + '</li>' +
            '<li data-type="post_tag" class="tax-post_tag">' + Upfront.Settings.l10n.global.content.tags + '</li>' +
            '</ul>' +
            $popup.top.html()
        );

        $popup.top.find('.upfront-tabs li').on("click", function () {
            dispatch_taxonomy_call(this);
        });

        $tax.show();

        dispatch_taxonomy_call($popup.top.find('.tax-' + currentView));

        Upfront.Events.on("upfront:post:taxonomy_changed", function () {
            dispatch_taxonomy_call($popup.top.find('.upfront-tabs li.active'));
        });
    },

    refreshTaxonomies: function(){
        this.trigger('tax:refresh');
    },
    toggle_section: function(e){
        e.preventDefault();
        var $this = $(e.target),
            $this_section = $this.closest(".ueditor-box-section"),
            $this_wrap = $this_section.find(".ueditor-box-content-wrap")
            ;

        $this_section.toggleClass("show");
        $this_wrap.slideToggle();
    }
});

var PostSectionView = Backbone.View.extend({
    events:{
        'click .ueditor-btn-edit': 'toggleEditor',
        'click .ueditor-button-cancel': 'cancelEdit',
        "click .ueditor-button-small-ok" : "update",
        'change input[type="radio"][name="visibility"]': 'visibility_radio_change',
        "change input[name='visibility']" : "set_visibility"
    },
    toggleEditor: function(e){
        e.preventDefault();
        var $button = $(e.target),
            $this_togglable = $button.siblings(".ueditor-togglable"),
            $this_prev_data_toggle = $button.closest(".misc-pub-section").find(".ueditor-previous-data-toggle")
            ;
        $(".ueditor-box-content-wrap .ueditor-togglable").not($this_togglable).slideUp();
        $(".ueditor-box-content-wrap .ueditor-btn-edit").show();
        $(".ueditor-previous-data-toggle").not( $this_prev_data_toggle ).show();

        $this_prev_data_toggle.hide();
        $button.hide();
        $this_togglable.slideDown(100);
    },
    cancelEdit: function(e){
        e.preventDefault();
        var $button = $(e.target),
            $this_prev_data_toggle = $button.closest(".misc-pub-section").find(".ueditor-previous-data-toggle")
            ;
        $this_prev_data_toggle.show();
        $button.closest(".ueditor-togglable").slideUp(100, function(){
            $button.closest(".ueditor-togglable").siblings(".ueditor-btn-edit").show();
        });

    },
    visibility_radio_change: function(e){
        var $this = $(e.target),
            val = $this.val(),
            $this_togglable = $(".ueditor-togglable-child-" + val)
            ;
        $this.closest(".ueditor-togglable").find(".ueditor-togglable-child").not($this_togglable).hide();
        $this_togglable.show();
    }
});

var ContentEditorTaxonomy_Hierarchical = PostSectionView.extend({
    termListingTpl : _.template($(editionBox_tpl).find('#upfront-term-list-tpl').html()),
    termSingleTpl : _.template($(editionBox_tpl).find('#upfront-term-single-tpl').html()),
    defaults: {
        title: "Categories"
    },
    className: "upfront-taxonomy-hierarchical",
    events: _.extend({},PostSectionView.prototype.events, this.events, {
        "click #upfront-tax-add_term": "handle_new_term",
        "click #add-new-taxonomies-btn": "toggle_add_new",
        "keydown #upfront-add_term": "handle_enter_new_term",
        "change .upfront-taxonomy_item": "handle_terms_update",
        'keydown #upfront-new_term': 'handle_enter_new_term',
        'click .ueditor-save-post-hie-tax': 'update'
    }),
    updateTimer: false,
    allTerms: false,
    initialize: function(options){
        //this.collection.on('add remove', this.render, this);
    },

    render: function() {
        var self = this,
            selected_term_ids = self.collection.pluck("term_id"),
            all_terms =  this.allTerms.sortBy(function(term, indx) {
                return selected_term_ids.indexOf( term.get("term_id") ) !== -1;
            })
            ;

        this.$el.html(
            this.termListingTpl(_.extend({}, this.defaults, {
                allTerms: this.allTerms.where({'parent': '0'}),
                postTerms: this.collection,
                termTemplate: this.termSingleTpl,
                labels: this.collection.taxonomyObject.labels
            }))
        );

    },

    handle_new_term: function() {
        var me = this,
            $term_name = this.$(".upfront-tax-new_term"),
            term_name = $term_name.val(),
            parentId, term
            ;

        if(!term_name)
            return false;

        if ($("#upfront-taxonomy-parents").length)
            parentId = $("#upfront-taxonomy-parents").val();

        term = new Upfront.Models.Term({
            taxonomy: this.collection.taxonomy,
            name: term_name,
            parent: parentId
        });

        term.save().done(function(response){
            me.allTerms.add(term);
            me.collection.add(term);
        });

        var new_term_html = this.termSingleTpl( {term: term, termTemplate: me.termSingleTpl, termId: term.get('term_id'), postTerms: me.collection, selected: true} );
        this.$("#upfront-taxonomy-list").prepend(new_term_html);
        this.$("#upfront-taxonomy-list").scrollTop(0);
        $term_name.val("");
    },

    handle_terms_update: function(e){
        var me = this,
            $target = $(e.target),
            termId = $target.val()
            ;

        if(!$target.is(':checked')){
            this.collection.remove(this.allTerms.get(termId));
        }
        else
            this.collection.add(this.allTerms.get(termId));

    },

    handle_enter_new_term: function (e) {
        if(e.which == 13){
            this.handle_new_term(e);
        }
    },
    update: function(e){
        this.collection.save();
        this.render();
    },
    toggle_add_new: function(){
        this.$(".ueditor-togglable-child").slideToggle();
    }
});

var ContentEditorTaxonomy_Flat = PostSectionView.extend({
    "className": "upfront-taxonomy-flat",
    termListTpl: _.template($(editionBox_tpl).find('#upfront-flat-term-list-tpl').html()),
    termSingleTpl: _.template($(editionBox_tpl).find('#upfront-term-flat-single-tpl').html()),
    changed: false,
    updateTimer: false,
    events: _.extend({}, PostSectionView.prototype.events, {
        "click .ueditor-button-small-flat-tax-add": "handle_new_term",
        'click .upfront-taxonomy_item-flat': 'handle_term_click',
        'keydown #upfront-flat-tax-add_term': 'handle_enter_new_term',
        'keydown .upfront-flat-tax-new_term': 'handle_enter_new_term',
        'click .upfront-taxonomy-list-choose-from-prev': 'toggle_prev_used_tax'
    }),
    initialize: function(options){
        this.collection.on('add remove', this.update, this);
    },
    render: function () {
        var	me = this,
            currentTerms = new Upfront.Collections.TermList(),
            otherTerms = new Upfront.Collections.TermList()
            ;
        this.allTerms.each(function (term, idx) {
            term.children = [];
            if(me.collection.get(term.get('term_id')))
                currentTerms.add(term);
            else
                otherTerms.add(term);
        });

        this.$el.html(this.termListTpl({
            currentTerms: currentTerms,
            otherTerms: otherTerms,
            termTemplate: this.termSingleTpl,
            labels: this.collection.taxonomyObject.labels
        }));
    },

    handle_term_click: function(e){
        var me = this,
            $target = $(e.currentTarget),
            termId = $target.attr('data-term_id');

        if($target.parent().attr('id') == 'upfront-taxonomy-list-current')
            this.collection.remove(termId);
        else
            this.collection.add(this.allTerms.get(termId));



    },

    handle_new_term: function (e) {
        e.preventDefault();

        var me = this,
            term_name = this.$(".upfront-flat-tax-new_term").val(),
            term
            ;

        if(! term_name)
            return false;

        term = new Upfront.Models.Term({
            taxonomy: this.collection.taxonomy,
            name: term_name
        });

        term.save().done(function(response){
            me.allTerms.add(term);
            me.collection.add(term).save();
        });
    },

    handle_enter_new_term: function (e) {
        if(e.which == 13){
            this.handle_new_term(e);
        }
    },
    toggle_prev_used_tax: function(e){
        e.preventDefault();
        this.$(".ueditor-togglable-child").slideToggle();
    },
    update: function(e){
        this.collection.save();
        this.render();
    }
});



var PostUrlEditor = PostSectionView.extend({
    className: "upfront-slug_editor-url",
    tpl : _.template($(editionBox_tpl).find("#post-url-editor").html()),
    initialize: function(opts){
        this.post = opts.post;
        this.render();
    },
    render: function(){
        var self = this,
            base = this.post.get("guid");
        base = base ? base.replace(/\?.*$/, '') : window.location.origin + '/';
        this.$el.html(this.tpl({
            rootUrl: base,
            slug: self.post.get('post_name')
        }));
    },
    update: function(e){
        e.preventDefault();
        var val = this.$(".ueditor-post-url-text").val();
        if( val.length > 1 ){
            this.post.set( "post_name", val );
            this.render();
        }
    }
});

var PostStatusView = PostSectionView.extend({
    statusOptions: {
        future: {value:'future', name: Upfront.Settings.l10n.global.content.scheduled},
        publish: {value: 'publish', name: Upfront.Settings.l10n.global.content.published},
        pending: {value: 'pending', name: Upfront.Settings.l10n.global.content.pending_review},
        draft: {value: 'draft', name: Upfront.Settings.l10n.global.content.draft},
        'private': {value: 'private', name: Upfront.Settings.l10n.global.content.private_post},
        'auto-draft': {value: 'auto-draft', name: Upfront.Settings.l10n.global.content.new_post},
        'trash': {value: 'trash', name: Upfront.Settings.l10n.global.content.deleted_post}
    },
    initialStatus: false,
    tpl: _.template($(editionBox_tpl).find('#post-status-tpl').html()),
    initialize: function(options){
        this.post = options.post;
        this.render();
    },
    render: function(){
        this.initialStatus = this.currentStatus = this.post.get("post_status");
        this.status = this.getStatus();
        this.options = this.getStatusOptions();
        this.$el.html( this.tpl(_.extend({}, this.post, {status: this.status}, {options: this.options} )) );
        return this;
    },
    getStatusOptions: function(postata){
        var ops = [],
            status = this.initialStatus
            ;

        if(status == 'publish'){
            ops.push(this.statusOptions.publish);
        }
        else if(status == 'future'){
            ops.push(this.statusOptions.future);
        }
        ops.push(this.statusOptions.pending);
        ops.push(this.statusOptions.draft);

        if(status == 'private'){
            ops = [ this.statusOptions.private ];
        }

        return ops;
    },
    getStatus: function(){
        var current = this.post.get("post_status");
        if(['auto-draft', 'draft', 'pending'].indexOf(current) != -1)
            return this.statusOptions[current];
        return this.statusOptions[this.initialStatus];
    },
    update: function(e){
        e.preventDefault();
        var status = this.$("select").val();
        if(!_.isEmpty( status ) && status !== this.initialStatus ){
            this.post.set("post_status", status);
            this.trigger("status:change", status);
            this.render();
        }
    }

});

var PostVisibilityView = PostSectionView.extend({
    tpl: _.template($(editionBox_tpl).find('#post-visibility-tpl').html()),
    post_password: "",
    postVisibility: false,
    visibilityOptions: {
        'public': {value: 'public', name:Upfront.Settings.l10n.global.content.public_post},
        'sticky': {value: 'sticky', name:Upfront.Settings.l10n.global.content.sticky},
        'password': {value: 'password', name: Upfront.Settings.l10n.global.content.protected_post},
        'private': {value: 'private', name: Upfront.Settings.l10n.global.content.is_private}
    },
    initialize: function(opts){
        this.post = opts.post;
        this.render();
    },
    render: function(){
        this.postVisibility = !this.postVisibility ? this.post.getVisibility() : this.postVisibility;
        this.status = this.visibilityOptions[ this.postVisibility ];
        if(this.postVisibility == 'password')
            this.post_password = this.post.get('post_password');

        this.$el.html( this.tpl(_.extend({}, this.post, {status : this.status, post_password: this.post_password} ) ) );
        return this;
    },
    getVisibilityOptions: function(){
        var now = this.post.getVisibility(),
            ops = this.visibilityOptions
            ;
        if(now == 'password')
            return [
                {value: 'password', name: Upfront.Settings.l10n.global.content.edit_pwd},
                ops.public,
                ops.sticky,
                ops.private
            ]
                ;
        return _.values(ops);
    },
    set_visibility: function(e){
        var visibility_status = $(e.target).val();
        this.postVisibility = visibility_status;
    },
    update: function(){
        var $pass = this.$(".ueditor-post-pass"),
            pass = $pass.val();
        this.postVisibility = this.$("input[name='sticky']").is(":checked") ? this.postVisibility = "sticky" : this.postVisibility;

        if( !this.visibilityOptions.hasOwnProperty( this.postVisibility ) ) return;

        switch ( this.postVisibility ){
            case "password":
                if( pass !== ""  ){
                    $pass.css("border", "1px solid #a3bfd9");
                    this.post.setVisibility(this.postVisibility);
                    this.post.set("post_password", pass);
                    this.trigger("visibility:change", "password", pass);
                }else{
                    $pass.css("border", "1px solid red");
                    return;
                }
                break;
            default:
                this.post.setVisibility(this.postVisibility);

                this.trigger("visibility:change", this.postVisibility, "");
                break;
        }

        this.render();
    }
});

var PostScheduleView = PostSectionView.extend({
    tpl: _.template($(editionBox_tpl).find('#post-schedule-tpl').html()),
    initialize: function(options){
        this.post = options.post;
        this.render();
    },
    render: function(){
        var date = new Object();
        this.initialDate = this.post.get("post_date");
        date.currentMonth = this.initialDate.getMonth();
        date.currentYear = this.initialDate.getFullYear();
        date.currentDay = this.initialDate.getDate();
        date.currentHour = this.initialDate.getHours();
        date.currentMinute = this.initialDate.getMinutes();
        this.schedule = this.getSchedule();
        this.$el.html( this.tpl(_.extend( {}, this.post, date, {schedule: this.schedule }) ) );
        return this;
    },
    getSchedule: function(){
        var now = new Date(),
            date = this.initialDate,
            formatDate = Upfront.Util.format_date
            ;
        if(!date && !this.initialDate)
            return {
                key: Upfront.Settings.l10n.global.content.publish,
                text: Upfront.Settings.l10n.global.content.immediately
            };

        if(date.getTime() == this.initialDate){
            if(date.getTime() < now.getTime())
                return {
                    key: Upfront.Settings.l10n.global.content.published,
                    text: formatDate(date, true)
                };
            else
                return {
                    key: Upfront.Settings.l10n.global.content.scheduled,
                    text: formatDate(date, true)
                };
        }

        if(date.getTime() < now.getTime())
            return {
                key: Upfront.Settings.l10n.global.content.publish_on,
                text: formatDate(date, true)
            };
        else
            return {
                key: Upfront.Settings.l10n.global.content.scheduled_for,
                text: formatDate(date, true)
            };
    },
    update: function(){
        var date = new Date(),
            year = this.$("input[name='yy']").val(),
            month = this.$("select[name='mm']").val(),
            day = this.$("input[name='jj']").val(),
            hour = this.$("input[name='hh']").val(),
            minute = this.$("input[name='mn']").val()
            ;
        date.setFullYear(year);
        date.setMonth(month);
        date.setDate(day);
        date.setHours(hour);
        date.setMinutes(minute);
        this.post.set("post_date", date);
        this.trigger('date:updated', date);
        this.render();
    }

});


return {
    Box: Box,
}

});})(jQuery);