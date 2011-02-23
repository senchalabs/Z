var Z = Ext.extend(Ext.Application, {
    name: 'z',

    onBeforeLaunch: function(config) {
        this.managers.init();
        this.config = this.managers.generateItem(Ext.getBody(), {
            xtype:'panel',
            fullscreen:true
        });
        Z.superclass.onBeforeLaunch.call(this, config);
    },

    launch: function () {
        console.log(this.config);
        var panel = Ext.Panel;
        for(component in Ext) {
            if(component.toLowerCase()==this.config.xtype) {
                panel = Ext[component];
                break;
            }
        }
        new panel(this.config);
    },

    managers: {
        init: function () {
            this.generateItem = function (element, config, managerName, index) {
                var dataAttributeNames = [];
                Ext.each(element.dom.attributes, function (attribute) {
                    if (attribute.name.substr(0,5)=='data-') {
                        config[attribute.name.substr(5)] = attribute.value;
                        dataAttributeNames.push(attribute.name);
                    }
                });
                var manager = (
                    this[managerName + 'Manager'] ||
                    this[element.getAttribute('data-zmanager') + 'Manager'] ||
                    this[element.getAttribute('data-xtype') + 'Manager'] ||
                    this[element.getAttribute('data-xtype') ? 'genericManager' : null] ||
                    this[element.dom.nodeName.toLowerCase() + 'Manager']
                );
                for(name in dataAttributeNames) {
                    element.dom.removeAttribute(dataAttributeNames[name]);
                }
                if (manager) {
                    for (var propertyFunction in manager) {
                        if (propertyFunction[0]=='_' && manager['do' + propertyFunction]!==false) {
                            var value = manager[propertyFunction](element, config, this, index);
                            if (value!==null) {
                                config[propertyFunction.substr(1)] = value;
                            }
                        }
                    }
                    return config;
                }
                return null;
            };

            this.bodyManager = this.genericManager = {

                do_xtype: true,
                _xtype: function (element, config) {
                    return element.getAttribute('data-xtype') || null;
                },

                do_items: true,
                doChildItem: function (childElement) {return true;},
                childItemManagerName: function (childElement) {},
                _items: function (element, config, managers) {
                    return this.items(element, config, managers, this.doChildItem);
                },

                do_docked_items: true,
                doDockedChildItem: function (childElement) {return false;},
                childItemManagerName: function (childElement) {},
                _docked_items: function (element, config, managers) {
                    return this.items(element, config, managers, this.doDockedChildItem);
                },

                items: function (element, config, managers, doChildItem) {
                    var items = [];
                    Ext.each(element.dom.childNodes, function (childNode, index) {
                        var childElement = Ext.get(childNode);
                        if (childElement && doChildItem(childElement)) {
                            var childItem = managers.generateItem(childElement, {}, this.childItemManagerName(childElement), index);
                            if (childItem) {
                                items.push(childItem);
                                childElement.remove();
                            }
                        }
                    }, this);
                    return items.length>0 ? items : null;
                },

                do_html: true,
                _html: function (element) {
                    var html = element.getHTML();
                    element.setHTML('');
                    return html ? html : null;
                }
            };


            this.h1Manager = this.toolbarManager = Ext.apply({}, {
                _xtype: function (element) { return 'toolbar'; },
                do_html: false,
                _title: function (element) {
                    return this._html(element);
                }
            }, this.genericManager);

            this.buttonManager = Ext.apply({}, {
                _xtype: function (element) { return 'button'; },
                do_html: false,
                _text: function (element) {
                    return this._html(element);
                }
            }, this.genericManager);

            this.olManager = this.ulManager = this.listManager = Ext.apply({}, {
                _xtype: function () { return 'list'; },
                do_items: false,
                do_html: false,
                _itemTpl: function (element) {
                    return '{text}';
                },
                _store: function (element, config, managers) {
                    return new Ext.data.Store({
                        model: Ext.regModel('', {
                            fields: [{name:'text', type:'string'}]
                        }),
                        data: this._items(element, config, managers)
                    });
                }
            }, this.genericManager);

            this.liManager = {
                _text: function (element) {
                    return element.getHTML();
                }
            };

            this.tabpanelManager = Ext.apply({}, {
                childItemManagerName: function (childElement) { return 'tab';},
                do_html: false
            }, this.genericManager);

            this.tabManager = Ext.apply({}, {
                _title: function (element, config, managers, index) {
                    return config['title'] || 'Tab ' + index;
                }
            }, this.genericManager);


        }
    }
});

var z = new Z();
