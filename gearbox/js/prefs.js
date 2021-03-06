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
    // private variables...
    var prefs = { },
        noSave = 0,
        that,
        mySession,
        localDefaults = { 'compact-view': false,
                          'filter-mode': 'all',
                          'filter-tracker': 'all',
                          'filter-text': '',
                          'show-backup-trackers': false,
                          'show-filterbar': true,
                          'show-options-window': true,
                          'show-statusbar': true,
                          'show-toolbar': true,
                          'show-tracker-scrapes': false,
                          'sort-mode': 'name',
                          'sort-reversed': false };

    function getLocalPrefs( )
    {
        var o = { };
        for( var key in localDefaults )
        {
            var value = Ext.util.Cookies.get( 'transmission-' + key );
            o[key] = value || localDefaults[key];
        }
        return o;
    }

    function saveChanges( changed )
    {
        var remoteArgs = { },
            haveRemoteArgs = false;

        for( var key in changed )
        {
            if( key in localDefaults )
                Ext.util.Cookies.set( 'transmission-'+key, changed[key] );
            else {
                remoteArgs[key] = changed[key];
                haveRemoteArgs = true;
            }
        }

        if( haveRemoteArgs )
            mySession.set( remoteArgs );
    }

    function addToPrefs( o )
    {
        var changedList = [ ],
            changedObj = { },
            changedIsEmpty = true;

        for( var key in o )
        {
            var value = o[key];

            if( prefs[key] != value )
            {
                prefs[key] = value;
                changedObj[key] = value;
                changedList.push( key );
                changedIsEmpty = false;
            }
        }

        if( !changedIsEmpty )
        {
            that.fireEvent( 'onPrefsChanged', changedList );

            if( noSave === 0 )
                saveChanges( changedObj );
        }
    }

    function onSessionChanged( o )
    {
        ++noSave;
        addToPrefs( o );
        --noSave;
    }

    Transmission.Prefs = Ext.extend( Ext.util.Observable,
    {
        get: function( key )
        {
            return prefs[key];
        },

        getBool: function( key )
        {
            var val = this.get( key );
            if( typeof val == 'boolean' ) return val;
            if( typeof val == 'string' ) { val=val.toLowerCase(); return val=='1' || val=='true'; }
            return false;
        },

        getNumber: function( key )
        {
            var val = this.get( key );
            if( typeof val == 'number' ) return val;
            if( typeof val == 'string' ) return parseFloat( val );
            return 0;
        },

        set: function( o )
        {
            addToPrefs( o );
        },

        constructor: function( config )
        {
            that = this;
            mySession = config.session;

            this.superclass().constructor.call( this, config );
            this.addEvents( 'onPrefsChanged' );

            addToPrefs( getLocalPrefs( ) );

            ++noSave;
            addToPrefs( config.session.sessionState );
            config.session.addListener( 'onSessionChanged', onSessionChanged );
            --noSave;
        }
    });
}());
