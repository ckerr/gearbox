/**
 * Gearbox: a Web GUI for Transmission
 * 
 * Copyright (c) Mnemosyne LLC
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

Ext.namespace( 'Transmission' );

(function()
{
    var myPrefs = null;
    var that = null;
    var numFieldWidth = 80;

    function textfieldHandler( e )
    {
        var o = { };
        o[e.id] = e.getValue().trim();
        myPrefs.set( o );
    }

    function spinnerHandler( e )
    {
        var o = { };
        o[e.id] = e.getValue();
        if( !e.task )
            e.task = new Ext.util.DelayedTask( function( o ) { myPrefs.set( o ); }, null, [o] );
        e.task.delay( 250, null, null, [o] );
    }

    function checkboxHandler( e )
    {
        var o = { };
        o[e.id] = e.checked;
        myPrefs.set( o );
    }

    function comboHandler( e )
    {
        var o = { };
        o[e.id] = e.getValue();
        myPrefs.set( o );
    }

    var comboDefaults = { disableKeyFilter: true,   
                          displayField: 'text',     
                          editable: false,          
                          forceSelection: true,     
                          listeners: { 'select': comboHandler }, 
                          mode: 'local',            
                          triggerAction: 'all',     
                          valueField: 'value',      
                          width: numFieldWidth,
                          xtype: 'combo' };

    var spinnerDefaults = { allowBlank: false,
                            allowDecimals: false,
                            allowNegative: false,
                            incrementValue: 1,
                            listeners: { 'change': spinnerHandler },
                            minValue: 0,
                            maxValue: 9999999, // 7 digit maximum
                            width: numFieldWidth,
                            xtype: 'spinnerfield' };

    function createTorrentTab( )
    {
        return new Ext.FormPanel( {
            title: 'Torrents',
            bodyCssClass: 'hig-body',
            labelWidth: 100,
            items: [
                {
                    xtype: 'fieldset',
                    title: 'Adding',
                    cls: 'hig-fieldset',
                    items: [
                         {
                            id: 'start-added-torrents',
                            xtype: 'checkbox',
                            hideLabel: true,
                            boxLabel: 'Start when added',
                            handler: checkboxHandler
                         }
                     ]
                },
                {
                    xtype: 'fieldset',
                    title: 'Downloading',
                    cls: 'hig-fieldset',
                    items: [
                         {
                            id: 'rename-partial-files',
                            xtype: 'checkbox',
                            hideLabel: true,
                            boxLabel: 'Append ".part" to incomplete files\' names',
                            handler: checkboxHandler
                         },
                         {
                            id: 'download-dir',
                            xtype: 'textfield',
                            fieldLabel: 'Save to location',
                            width: 170,
                            listeners: { change: textfieldHandler }
                         },
                         {
                            xtype: 'checkbox',
                            handler: checkboxHandler,
                            boxLabel: 'Use incomplete directory',
                            hideLabel: true,
                            checked: myPrefs.getBool( 'incomplete-dir-enabled' ),
                            id: 'incomplete-dir-enabled'
                         },
                         {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 300, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'displayfield',
                                    value: 'Directory:',
                                    width: 100
                                },
                                {
                                    xtype: 'textfield',
                                    id: 'incomplete-dir',
                                    listeners: { change: textfieldHandler },
                                    value: myPrefs.get( 'incomplete-dir' ),
                                    width: 170
                                }
                            ]
                         },
                         {
                            xtype: 'checkbox',
                            handler: checkboxHandler,
                            boxLabel: 'Call script when complete',
                            hideLabel: true,
                            checked: myPrefs.getBool( 'script-torrent-done-enabled' ),
                            id: 'script-torrent-done-enabled'
                         },
                         {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 300, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'displayfield',
                                    value: 'Script:',
                                    width: 100
                                },
                                {
                                    xtype: 'textfield',
                                    id: 'script-torrent-done-filename',
                                    listeners: { change: textfieldHandler },
                                    value: myPrefs.get( 'script-torrent-done-filename' ),
                                    width: 170
                                }
                            ]
                         }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: 'Seeding Limits',
                    cls: 'hig-fieldset',
                    items: [
                        {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 300, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'checkbox',
                                    handler: checkboxHandler,
                                    boxLabel: 'Stop seeding at ratio:',
                                    checked: myPrefs.getBool( 'seedRatioLimited' ),
                                    id: 'seedRatioLimited',
                                    width: 190
                                },
                                Ext.applyIf( {
                                    allowDecimals: true,
                                    id: 'seedRatioLimit',
                                    incrementValue: 0.5,
                                    value: myPrefs.getNumber( 'seedRatioLimit' )
                                    }, spinnerDefaults )
                            ]
                        },
                        {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 300, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'checkbox',
                                    handler: checkboxHandler,
                                    boxLabel: 'Stop seeding if idle for N min:',
                                    checked: myPrefs.getBool( 'idle-seeding-limit-enabled' ),
                                    id: 'idle-seeding-limit-enabled',
                                    width: 190
                                },
                                Ext.applyIf( {
                                    id: 'idle-seeding-limit',
                                    incrementValue: 5,
                                    value: myPrefs.getNumber( 'idle-seeding-limit' )
                                    }, spinnerDefaults )
                            ]
                        },
                    ]
                }
            ]
        } );
    }

    function buildTimeList( )
    {
        var a = [ ];
        for( var min=0; min<1440; min+=15 )
        {
            var hr = parseInt( min / 60 );
            var str = String.leftPad(hr,2,'0') + ':' + String.leftPad(min%60,2,'0');
            a.push( [ min, str ] );
        }
        return a;
    }

    function onPrefsChanged( keys )
    {
        for( var i=0, n=keys.length; i<n; ++i )
        {
            var key = keys[i];
            var e = Ext.getCmp( key );
            if( e != null) switch( e.xtype )
            {
                case 'checkbox': 
                    e.setValue( myPrefs.getBool(key) );
                    break;

                case 'combo':
                case 'numberfield':
                case 'spinnerfield':
                case 'textfield':
                    e.setValue( myPrefs.get(key) );
                    break;

                default:
                    break;
            }
        }
    }

    function createSpeedTab( prefs )
    {
        var upLabel = String.format( 'Limit upload speed ({0})', Transmission.fmt.speedUnitStr );
        var dnLabel = String.format( 'Limit download speed ({0})', Transmission.fmt.speedUnitStr );
        var timeStore = buildTimeList( );

        return new Ext.FormPanel( {
            title: 'Speed',
            bodyCssClass: 'hig-body',
            labelWidth: 165,
            items: [
                {
                    xtype: 'fieldset',
                    title: 'Speed Limits',
                    cls: 'hig-fieldset',
                    items: [
                        {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 270, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'checkbox',
                                    handler: checkboxHandler,
                                    boxLabel:[ dnLabel, ':' ].join(''),
                                    checked: myPrefs.getBool( 'speed-limit-down-enabled' ),
                                    id: 'speed-limit-down-enabled',
                                    width: 185
                                },
                                Ext.applyIf( {
                                    id: 'speed-limit-down',
                                    incrementValue: 5,
                                    value: myPrefs.getNumber( 'speed-limit-down' )
                                    }, spinnerDefaults )
                            ]
                        },
                        {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 270, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'checkbox',
                                    handler: checkboxHandler,
                                    boxLabel:[ upLabel, ':' ].join(''),
                                    checked: myPrefs.getBool( 'speed-limit-up-enabled' ),
                                    id: 'speed-limit-up-enabled',
                                    width: 185
                                },
                                Ext.applyIf( {
                                    id: 'speed-limit-up',
                                    incrementValue: 5,
                                    value: myPrefs.getNumber( 'speed-limit-up' )
                                    }, spinnerDefaults )
                            ]
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: 'Temporary Speed Limits',
                    cls: 'hig-fieldset',
                    items: [
                        {
                            xtype: 'displayfield',
                            hideLabel: true,
                            style: 'font-size:0.85em',
                            value: 'Override normal speed limits manually or at scheduled times'
                        },
                        {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 270, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'displayfield',
                                    hideLabel: true,
                                    value: dnLabel + ':',
                                    width: 185
                                },
                                Ext.applyIf( {
                                    id: 'alt-speed-down',
                                    incrementValue: 5,
                                    value: myPrefs.getNumber( 'alt-speed-down' )
                                    }, spinnerDefaults )
                            ]
                        },
                        {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 270, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'displayfield',
                                    hideLabel: true,
                                    value: upLabel + ':',
                                    width: 185
                                },
                                Ext.applyIf( {
                                    id: 'alt-speed-up',
                                    incrementValue: 5,
                                    value: myPrefs.getNumber( 'alt-speed-up' )
                                    }, spinnerDefaults )
                            ]
                        },
                        {
                            xtype: 'compositefield',
                            hideLabel: true,
                            width: 270, // FIXME auto width messing up firefox
                            items: [
                                {
                                    xtype: 'checkbox',
                                    handler: checkboxHandler,
                                    boxLabel: 'Scheduled times:',
                                    checked: myPrefs.get( 'alt-speed-time-enabled' ),
                                    id: 'alt-speed-time-enabled',
                                    width: 120
                                },
                                Ext.applyIf( {
                                    id: 'alt-speed-time-begin',
                                    store: timeStore,
                                    value: myPrefs.get( 'alt-speed-time-begin' ),
                                    width: 65
                                    }, comboDefaults ),
                                {
                                    xtype: 'displayfield',
                                    value: 'to'
                                },
                                Ext.applyIf( {
                                    id: 'alt-speed-time-end',
                                    store: timeStore,
                                    value: myPrefs.get( 'alt-speed-time-end' ),
                                    width: 60
                                    }, comboDefaults )
                            ]
                        },
                        Ext.applyIf( { id: 'alt-speed-time-day', xtype: 'combo', fieldLabel: 'On days', width: 100, store: [
                            [ 127, 'Everyday' ],
                            [ 62, 'Weekdays' ],
                            [ 65, 'Weekends' ],
                            [ 1, 'Sunday' ],
                            [ 2, 'Monday' ],
                            [ 4, 'Tuesday' ],
                            [ 8, 'Wednesday' ],
                            [ 16, 'Thursday' ],
                            [ 32, 'Friday' ],
                            [ 64, 'Saturday' ] ] }, comboDefaults )
                    ]
                }
            ]
        } );
    }

    function createPrivacyTab( )
    {
        return new Ext.FormPanel( {
            title: 'Privacy',
            bodyCssClass: 'hig-body',
            items: [
                    { xtype: 'fieldset', title: 'Blocklist', cls: 'hig-fieldset', items: [
                        { id: 'blocklist-enabled', handler: checkboxHandler, xtype: 'checkbox', hideLabel: true, boxLabel: 'Enable blocklist' },
                        { xtype: 'checkbox', hideLabel: true, boxLabel: 'Enable automatic updates' },
                        { xtype: 'button', hideLabel: true, text: 'Update now' }
                    ] },
                    { xtype: 'fieldset', title: 'Privacy', cls: 'hig-fieldset', items: [
                        Ext.applyIf( { width: 140, id: 'encryption', fieldLabel: 'Encryption', store: [
                            [ 'tolerated', 'Allow encryption' ], [ 'preferred', 'Prefer encryption' ], [ 'required', 'Reqire encryption' ] ] }, comboDefaults ),
                        { id: 'pex-enabled', handler: checkboxHandler, xtype: 'checkbox', hideLabel: true, boxLabel: 'Use PEX to find more peers' },
                        { id: 'dht-enabled', handler: checkboxHandler, xtype: 'checkbox', hideLabel: true, boxLabel: 'Use DHT to find more peers' },
                        { id: 'lpd-enabled', handler: checkboxHandler, xtype: 'checkbox', hideLabel: true, boxLabel: 'Use Local Peer Discovery to find more peers' }
                    ] }
            ]
        } );
    }

    function createNetworkTab( )
    {
        return new Ext.FormPanel( {
            title: 'Network',
            bodyCssClass: 'hig-body',
            labelWidth: 140,
            items: [
                { xtype: 'fieldset', title: 'Incoming Peers', cls: 'hig-fieldset', items: [
                      Ext.applyIf( {
                        id: 'peer-port',
                        fieldLabel: 'Port for incoming peers'
                        }, spinnerDefaults )
                    , { xtype: 'checkbox', handler: checkboxHandler, hideLabel: true, id: 'peer-port-random-on-start', boxLabel: 'Pick a random port when Transmission starts' }
                    , { xtype: 'checkbox', handler: checkboxHandler, hideLabel: true, id: 'port-forwarding-enabled', boxLabel: 'Use UPnP or NAT-PMP port forwarding from my router' } ] }
                , {
                    xtype: 'fieldset',
                    title: 'Limits',
                    cls: 'hig-fieldset',
                    defaults: spinnerDefaults,
                    items: [
                        {
                            id: 'peer-limit-per-torrent',
                            incrementValue: 5,
                            fieldLabel: 'Maximum peers per torrent',
                            maxValue: 300
                        },
                        {
                            id: 'peer-limit-global',
                            incrementValue: 5,
                            fieldLabel: 'Maximum peers overall',
                            maxValue: 3000
                        }
                    ]
                }
            ]
        } );
    }

    function createWorkArea( prefs )
    {
        var tabs = [ createTorrentTab( ),
                     createSpeedTab( prefs ),
                     createPrivacyTab( ),
                     createNetworkTab( ) ];
        return new Ext.TabPanel( { activeTab: 0, height: 333, autoWidth: true, items: tabs } );
    }

    Transmission.PrefsDialog = Ext.extend( Ext.Window, {

        close: function( )
        {
            myPrefs.removeListener( 'onPrefsChanged', onPrefsChanged );    
            Transmission.PrefsDialog.superclass.close.call( this );
        },

        constructor: function( config_in )
        {
            that = this;
            myPrefs = config_in.prefs;
            var config = Ext.apply( { }, config_in, {
                width: 433,
                height: 380,
                layout: 'fit',
                cls: 'hig-dialog',
                title: 'Preferences',
                items: createWorkArea( myPrefs )
            } );
            Transmission.PrefsDialog.superclass.constructor.call( this, config );
            myPrefs.addListener( 'onPrefsChanged', onPrefsChanged );    
            onPrefsChanged( [ 'peer-port-random-on-start',
                              'rename-partial-files',
                              'show-statusbar',
                              'show-filterbar',
                              'start-added-torrents',
                              'sort-mode',
                              'pex-enabled',
                              'speed-limit-up',
                              'speed-limit-up-enabled',
                              'speed-limit-down',
                              'speed-limit-down-enabled',
                              'idle-seeding-limit',
                              'idle-seeding-limit-enabled',
                              'incomplete-dir',
                              'incomplete-dir-enabled',
                              'script-torrent-done-enabled',
                              'script-torrent-done-filename',
                              'alt-speed-up',
                              'alt-speed-down',
                              'alt-speed-time-begin',
                              'alt-speed-time-enabled',
                              'alt-speed-time-end',
                              'alt-speed-time-day',
                              'download-dir',
                              'peer-limit-per-torrent',
                              'peer-port',
                              'peer-limit-global',
                              'seedRatioLimit',
                              'seedRatioLimited',
                              'encryption',
                              'dht-enabled',
                              'port-forwarding-enabled',
                              'blocklist-enabled',
                              'lpd-enabled' ] );
        }
    });
}());

