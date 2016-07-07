(function($){

    define([], function(){

        return Backbone.View.extend({
            className: 'upfront-loading',
            is_done: false,
            done_callback: [],
            done_timeout: false,
            initialize: function (opts) {
                this.options = opts;
            },
            render: function () {
                var me = this;

                this.$el.html('<div class="upfront-loading-ani" />');

                if (this.options.fixed) this.$el.addClass('upfront-loading-fixed');
                if (this.options.loading_type) this.$el.addClass(this.options.loading_type);
                if (this.options.loading) this.$el.append('<p class="upfront-loading-text">' + this.options.loading + '</p>');
                if (this.options.loading_notice) this.$el.append('<p class="upfront-loading-notice">' + this.options.loading_notice + '</p>');

                // Allow loaders to not overlap, kill this one on start of next one
                if (me.options.remove_on_event) {
                    Upfront.Events.once(me.options.remove_on_event, function() {
                        me.remove();
                        clearTimeout(me.done_timeout);
                        if ( me.done_callback ) _(me.done_callback).each(function(cbk) { if (cbk && cbk.call) cbk.call(me); });
                    });
                }

                this.$el.find('.upfront-loading-ani').on('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(){
                    var state = me.$el.hasClass('upfront-loading-repeat') ? 'repeat' : (me.$el.hasClass('upfront-loading-done') ? 'done' : 'start');
                    if ( state == 'start' ){
                        if ( me.is_done && !me.options.remove_on_event){
                            var done = me.done_text || me.options.done;
                            me.$el.addClass('upfront-loading-done');
                            me.$el.find('.upfront-loading-text').text(done);
                        }
                        else
                            me.$el.addClass('upfront-loading-repeat');
                    }
                    else if ( state == 'repeat' ) {
                        me.$el.removeClass('upfront-loading-repeat');
                    }
                    else if ( state == 'done' ) {
                        if (me.options.remove_on_event) return;
                        me.remove();
                        clearTimeout(me.done_timeout);
                        if ( me.done_callback ) _(me.done_callback).each(function(cbk) { if (cbk && cbk.call) cbk.call(me); });
                    }
                });
            },
            update_loading_text: function (loading) {
                this.$el.find('.upfront-loading-text').text(loading);
            },
            on_finish: function (callback) {
                this.done_callback.push(callback);
            },
            done: function (callback, done) {
                var me = this;
                var timeout = me.options.timeout || 6000;
                this.is_done = true;
                this.done_timeout = setTimeout(function(){
                    if ( me ){
                        me.remove();
                        _(me.done_callback).each(function(cbk) {
                            if (cbk && cbk.call) cbk.call(me);
                        });
                    }
                }, timeout);
                if (callback) callback.call(me);
                this.done_text = done;
            },
            cancel: function (callback, canceled) {
                this.remove();
                if ( callback ) callback();
            }
        });

    });

}(jQuery));