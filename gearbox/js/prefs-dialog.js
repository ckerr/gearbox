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
    var numFieldWidth = 100;

    function textfieldHandler( e )
    {
        var o = { };
        o[e.id] = e.getValue().trim();
        myPrefs.set( o );
    }

    function checkboxHandler( e )
    {
        var o = { };
        o[e.id] = e.checked;
        myPrefs.set( o );
    }

    function comboHandler( e )
    {
        var value = e.getValue( );
        var o = { };
        if( e.id == 'idle' )
        {
            if( value < 0 )
                o['idle-seeding-limit-enabled'] = false;
            else {
                o['idle-seeding-limit-enabled'] = true;
                o['idle-seeding-limit'] = value;
            }
        }
        else if( e.id == 'seedRatio' )
        {
            if( value < 0 )
                o.seedRatioLimited = false;
            else {
                o.seedRatioLimited = true;
                o.seedRatioLimit = value;
            }
        }
        else
        {
            o[e.id] = value;
        }
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

    function createTorrentTab( )
    {
        return new Ext.FormPanel( {
            title: 'Torrents',
             bodyCssClass: 'hig-body',
            labelWidth: 100,
            items: [ { xtype: 'fieldset', title: 'Adding', cls: 'hig-fieldset', items: [
                         { id: 'start-added-torrents', xtype: 'checkbox', hideLabel: true, boxLabel: 'Start when added', handler: checkboxHandler },
                         { id: 'rename-partial-files', xtype: 'checkbox', hideLabel: true, boxLabel: 'Append ".part" to incomplete files\' names', handler: checkboxHandler },
                         { id: 'download-dir', xtype: 'textfield', fieldLabel: 'Save to location', width: 150, listeners: { change: textfieldHandler } } ] },
                     { xtype: 'fieldset', title: 'Stop Seeding a Torrent When', cls: 'hig-fieldset',
                        defaults: comboDefaults, items: [
                        { id: 'seedRatio', fieldLabel: 'its Ratio Reaches', store: [ [ -1, 'Unlimited'], [ 0.5, '0.5' ], [ 1, '1' ], [ 2, '2' ], [ 3, '3' ], [ 5, '5' ], [ 10, '10' ], [ 20, '20' ] ] },
                        { id: 'idle', fieldLabel: 'it\'s idle for', store: [ [ -1, 'Unlimited'], [ 2, '2 minutes' ], [ 5, '5 minutes' ], [ 10, '10 minutes' ], [ 30, '30 minutes' ], [ 60, '1 hour' ], [ 120, '2 hours' ] ] }
                     ] } ]
        } );
    }

    function buildTimeList( )
    {
        var a = [ ];
        for( var min=0; min<1440; min+=15 )
        {
            var hr = parseInt( min / 60 );
            var am = hr < 12;
            if( hr < 1 ) hr = 12;
            var str = String.leftPad(hr,2,'0') + ':'
                     + String.leftPad(min%60,2,'0') + ' ' + (am?'AM':'PM');
            a.push( [ min, str ] );
        }
        return a;
    }

    var peerLimitsList = [
        [ 10, 10 ],
        [ 20, 20 ],
        [ 30, 30 ],
        [ 40, 40 ],
        [ 50, 50 ],
        [ 75, 75 ],
        [ 100, 100 ],
        [ 150, 150 ],
        [ 200, 200 ],
        [ 250, 250 ],
        [ 300, 300 ],
        [ 350, 350 ],
        [ 400, 400 ]
    ];

    var defaultSpeeds = [
        [ 10, Transmission.fmt.speed(10) ],
        [ 25, Transmission.fmt.speed(25) ],
        [ 40, Transmission.fmt.speed(40) ],
        [ 50, Transmission.fmt.speed(50) ],
        [ 75, Transmission.fmt.speed(75) ],
        [ 100, Transmission.fmt.speed(100) ],
        [ 125, Transmission.fmt.speed(125) ],
        [ 150, Transmission.fmt.speed(150) ],
        [ 175, Transmission.fmt.speed(175) ],
        [ 200, Transmission.fmt.speed(200) ],
        [ 250, Transmission.fmt.speed(250) ],
        [ 300, Transmission.fmt.speed(300) ],
        [ 500, Transmission.fmt.speed(500) ]
    ];

    function createSpeedStore( includeUnlimited, currentSpeed )
    {
        var speeds = [ ];
        var currentSpeedStore = [ currentSpeed, Transmission.fmt.speed( currentSpeed ) ];

        if( includeUnlimited )
            speeds.push( [ -1, 'Unlimited' ] );

        // build the array 'speeds', which is defaultSpeeds + the current speed
        var added = false;
        for( var i=0, n=defaultSpeeds.length; i<n; ++i ) {
            if( !added && ( currentSpeed < defaultSpeeds[i][0] ) ) {
                speeds.push( currentSpeedStore );
                added = true;
            }
            speeds.push( defaultSpeeds[i] );
            added |= currentSpeed == defaultSpeeds[i][0];
        }
        if( !added )
            speeds.push( currentSpeedStore );
      
        return speeds;
    }

    function createUpSpeedStore( prefs )
    {
        var limit = prefs.get( 'speed-limit-up' ) || 100;
        return createSpeedStore( true, limit );
    } 

    function createDownSpeedStore( prefs )
    {
        var limit = prefs.get( 'speed-limit-down' ) || 100;
        return createSpeedStore( true, limit );
    }

    function createAltUpSpeedStore( prefs )
    {
        var limit = prefs.get( 'alt-speed-up' ) || 100;
        return createSpeedStore( false, limit );
    }

    function createAltDownSpeedStore( prefs )
    {
        var limit = prefs.get( 'alt-speed-down' ) || 100;
        return createSpeedStore( false, limit );
    }

    function onPrefsChanged( keys )
    {
        var updateRatio = false;
        var updateIdle = false;

        for( var i=0, n=keys.length; i<n; ++i )
        {
            var key = keys[i];

            updateRatio |= key=='seedRatioLimit' || key=='seedRatioLimited';
            updateIdle |= key=='idle-seeding-limit' || key=='idle-seeding-limit-enabled';

            var e = Ext.getCmp( key );
            if( e != null) switch( e.xtype )
            {
                case 'checkbox': 
                    e.setValue( myPrefs.getBool(key) );
                    break;

                case 'combo':
                case 'numberfield':
                case 'textfield':
                    e.setValue( myPrefs.get(key) );
                    break;

                default:
                    //console.log( 'unhandled xtype: ' + e.xtype );
                    break;
            }
        }

        if( updateRatio ) 
        {
            var value = myPrefs.getBool('seedRatioLimited') ? myPrefs.getNumber('seedRatioLimit') : -1;
            Ext.getCmp( 'seedRatio').setValue( value );
        }
        if( updateIdle )
        {
            var value = myPrefs.getBool('idle-seeding-limit-enabled') ? myPrefs.getNumber('idle-seeding-limit') : -1;
            Ext.getCmp( 'idle' ).setValue( value );
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
            labelWidth: 160,
            items: [
                    { xtype: 'fieldset', title: 'Speed Limits', cls: 'hig-fieldset',
                        defaults: comboDefaults,
                        items: [ { fieldLabel: dnLabel, id: 'speed-limit-down', store: createDownSpeedStore( prefs ) },
                                 { fieldLabel: upLabel, id: 'speed-limit-up', store: createUpSpeedStore( prefs ) } ] },
                    { xtype: 'fieldset', title: 'Temporary Speed Limits', cls: 'hig-fieldset', items: [
                        Ext.apply( { fieldLabel: dnLabel, id: 'alt-speed-down', store: createAltDownSpeedStore( prefs ) }, comboDefaults ),
                        Ext.apply( { fieldLabel: upLabel, id: 'alt-speed-up', store: createAltUpSpeedStore( prefs ) }, comboDefaults ),
                        { xtype: 'checkbox', hideLabel: true, boxLabel: 'Only at scheduled times', id: 'alt-speed-time-enabled'  },
                        Ext.applyIf( { store: timeStore, fieldLabel: 'From', id: 'alt-speed-time-begin' }, comboDefaults ),
                        Ext.applyIf( { store: timeStore, fieldLabel: 'To',   id: 'alt-speed-time-end'   }, comboDefaults ),
                        Ext.apply( { id: 'alt-speed-time-day', xtype: 'combo', fieldLabel: 'On days', store: [
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
                    ] }
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
            labelWidth: 133,
            items: [
                { xtype: 'fieldset', title: 'Incoming Peers', cls: 'hig-fieldset', items: [
                      { xtype: 'numberfield', allowNegative: false, allowDecimals: false, id: 'peer-port', fieldLabel: 'Port for incoming peers', width: numFieldWidth }
                    , { xtype: 'checkbox', handler: checkboxHandler, hideLabel: true, id: 'peer-port-random-on-start', boxLabel: 'Pick a random port when Transmission starts' }
                    , { xtype: 'checkbox', handler: checkboxHandler, hideLabel: true, id: 'port-forwarding-enabled', boxLabel: 'Use UPnP or NAT-PMP port forwarding from my router' } ] }
                , { xtype: 'fieldset', title: 'Limits', cls: 'hig-fieldset', items: [
                    Ext.applyIf( { id: 'peer-limit-per-torrent', fieldLabel: 'Maximum peers per torrent', store: peerLimitsList }, comboDefaults ),
                    Ext.applyIf( { id: 'peer-limit-global', fieldLabel: 'Maximum peers overall', store: peerLimitsList }, comboDefaults )
                ] }
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
                cls: 'hig-dialog',
                title: 'Preferences',
                items: createWorkArea( myPrefs )
            } );
            Transmission.PrefsDialog.superclass.constructor.call( this, config );
            myPrefs.addListener( 'onPrefsChanged', onPrefsChanged );    
            onPrefsChanged( [ 'compact-view',
                              'peer-port-random-on-start',
                              'rename-partial-files',
                              'show-statusbar',
                              'show-filterbar',
                              'start-added-torrents',
                              'sort-mode',
                              'pex-enabled',
                              'speed-limit-up',
                              'speed-limit-down',
                              'idle-seeding-limit',
                              'idle-seeding-limit-enabled',
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

