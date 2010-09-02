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

FileView = Ext.extend( Ext.Container,
{
    torrentId: -1,
    fileStore: null,
    session: null,

    compareStringToPropertyPath: function( a, b )
    {
        return a.localeCompare( b.path );
    },

    /****
    *****
    ****/

    findRecordFromFileIndex: function( i )
    {
        var index = this.fileStore.findExact( 'fileIndex', i );
        return index == -1 ? null : this.fileStore.getAt( index );
    },

    findRecordFromId: function( id )
    {
        var index = this.fileStore.findExact( '_id', id );
        return index == -1 ? null : this.fileStore.getAt( index );
    },

    /****
    *****
    ****/

    No: 0,
    Yes: 1,
    Mixed: 999,
    Low: -1,
    Normal: 0,
    High: 1,

    /* return Yes, No, or Mixed */
    isSubtreeWanted: function( record )
    {
        if( record.data._is_leaf )
            return record.data.wanted ? this.Yes : this.No;

        var wanted;
        for( var i=0, n=record.data.children.length; i<n; ++i )
        {
            var child = this.findRecordFromId( record.data.children[i] );
            var childWanted = this.isSubtreeWanted( child );

            if( i === 0 )
                wanted = childWanted;
            if( wanted != childWanted )
                wanted = this.Mixed;
            if( wanted === this.Mixed )
                break;
        }
        return wanted;
    },

    getDescendantLeaves: function( record, fileIndices )
    {
        if( record.data._is_leaf )
        {
            fileIndices.push( record.data.fileIndex );
        }
        else
        {
            var children = record.data.children;
            for( var i=0, n=children.length; i<n; ++i )
                this.getDescendantLeaves( this.findRecordFromId( children[i] ), fileIndices );
        }
    },

    twiddleWanted: function( record )
    {
        var fileIndices = [ ];
        this.getDescendantLeaves( record, fileIndices );
        var isWanted = this.isSubtreeWanted( record ) != this.Yes;
        this.session.setFilesWanted( this.torrentId, fileIndices, isWanted );
    },

    /****
    *****
    ****/

    getPriorityString: function( record )
    {
        var priority = this.getPriority( record );
        if( priority == this.Low ) return 'Low';
        if( priority == this.High ) return 'High';
        if( priority == this.Normal ) return 'Normal';
        return 'Mixed';
    },

    getPriority: function( record )
    {
        if( record.data._is_leaf )
            return record.data.priority;

        var priority;
        for( var i=0, n=record.data.children.length; i<n; ++i )
        {
            var child = this.findRecordFromId( record.data.children[i] );
            var childPriority = this.getPriority( child );

            if( i === 0 )
                priority = childPriority;
            if( priority != childPriority )
                priority = this.Mixed;
            if( priority == this.Mixed )
                break;
        }

        return priority;
    },

    twiddlePriority: function( record )
    {
        var n;
        var o = this.getPriority( record );
        
             if( o === this.Normal ) n = this.High;
        else if( o === this.High )   n = this.Low;
        else                         n = this.Normal;

        var fileIndices = [ ];
        this.getDescendantLeaves( record, fileIndices );
        this.session.setFilePriorities( this.torrentId, fileIndices, n );
    },

    /****
    *****
    ****/

    parseFiles: function( id )
    {
        var record = Torrent.store.getById( this.torrentId );
        if( !record )
            return null;

        // parse the files array
        var tmp = { children: [ ] };
        var files = record.getFiles( );
        var branchIds = { };
        var data = [ ];
        var _id = 0;
        var folderIcon = Transmission.FileIcon.getFolderIcon( Transmission.FileIcon.SMALL );

        for( var i=0, n=files.length; i<n; ++i )
        {
            var myparent = tmp;
            var tokens = files[i].name.split( '/' );
            var path = '';
            var _parent = null;

            for( var j=0, jn=tokens.length; j<jn; ++j )
            {
                var name = tokens[j];
                var collatedName = name.toUpperCase();
                var isLeaf = j + 1 == jn;

                path += '/' + name;
                var l = data.lowerBound( path, this.compareStringToPropertyPath );
                if( !l.match )
                {
                    var row = { path: path,
                                name: name,
                                children: [ ],
                                bytesCompleted: 0,
                                collatedName: collatedName,
                                fileIndex: isLeaf ? i : -1,
                                _id: _id++,
                                _parent: _parent ? _parent._id : null,
                                _parentObj: _parent,
                                _is_leaf: isLeaf,
                                icon: isLeaf ? Transmission.FileIcon.getIcon( name, Transmission.FileIcon.SMALL ) : folderIcon,
                                wanted: false,
                                priority: 0 };
                    data.splice( l.index, 0, row );

                    if( _parent )
                        _parent.children.push( row._id );
                }

                _parent = data[l.index];
            }
        }

        return data;
    },

    nameSortType: function( node ) { return node.attributes.collatedName; },
    wantedSortType: function( node ) { return node.attributes.wanted ? 1 : 0; },
    prioritySortType: function( node ) { return node.attributes.priority; },

    onStoreLoaded: function( store, records, options )
    {
        store.expandNode( store.getAt( 0 ) );
    },

    nameRenderer: function( value, metaData, record, rowIndex, colIndex, store )
    {
        return [ '<img src="', record.data.icon, '"/> ', record.data.name ].join('');
    },

    wantedRenderer: function( value, metaData, record, rowIndex, colIndex, store )
    {
        var extra;

        switch( this.isSubtreeWanted( record ) ) {
            case this.Yes   : extra = 'x-file-wanted-checker-on'; break;
            case this.No    : extra = 'x-file-wanted-checker-off'; break;
            default         : extra = 'x-file-wanted-checker-mixed'; break;
        }

        return [ '<div style="width:20px;" class="x-file-wanted-checker ', extra, '"></div>' ].join('');
    },

    priorityRenderer: function( value, metaData, record, rowIndex, colIndex, store )
    {
        return this.getPriorityString( record );
    },

    onWantedClicked: function( store, rowIndex, record )
    {
        this.twiddleWanted( record );
    },

    onPriorityClicked: function( store, rowIndex, record )
    {
        this.twiddlePriority( record );
    },

    onCellClick: function( grid, rowIndex, columnIndex, event )
    {
        var store = grid.getStore();
        var record = store.getAt(rowIndex);
        switch( columnIndex ) {
            case 1: this.onWantedClicked( store, rowIndex, record ); break;
            case 2: this.onPriorityClicked( store, rowIndex, record ); break;
            default: break; // nothing interesting to do for the other cols
        }
    },

    constructor: function( config_in )
    {
        var id = config_in.record.getId( );
        this.torrentId = id;
        this.session = config_in.session;

        var record = Ext.data.Record.create([
            {name: 'name', type: 'string'},
            {name: 'collatedName', type: 'string'},
            {name: 'size', type: 'int'},
            {name: 'children', type: 'auto'},
            {name: 'have', type: 'int'},
            {name: 'icon', type: 'string'},
            {name: 'fileIndex', type: 'int'},
            {name: 'bytesCompleted', type: 'int'},
            {name: 'wanted', type: 'int'},
            {name: 'priority', type: 'int'},
            {name: 'path', type: 'string'},
            {name: '_id', type: 'int'},
            {name: '_parent', type: 'auto'},
            {name: '_is_leaf', type: 'bool'}
        ]);

        var data = this.parseFiles( id );

        var store = new Ext.ux.maximgb.tg.AdjacencyListStore({
            autoLoad : true,
            reader: new Ext.data.JsonReader({id: '_id'}, record),
            proxy: new Ext.data.MemoryProxy(data)
        });

        this.fileStore = store;

        var grid = new Ext.ux.maximgb.tg.EditorGridPanel({
            store: store,
            stripeRows: false,
            autoExpandColumn: 'name',
            master_column_id : 'name',
            columns: [
                { header: 'Name', menuDisabled: true, sortable: true, dataIndex: 'name', width: 100, id: 'name', scope: this, renderer: this.nameRenderer },
                { header: 'Want', menuDisabled: true, sortable: true, dataIndex: 'wanted', resizable: false, width: 40, scope: this, renderer: this.wantedRenderer },
                { header: 'Priority', menuDisabled: true, sortable: true, dataIndex: 'priority', resizable: false, width: 50, scope: this, renderer: this.priorityRenderer } ]
        });

        grid.addListener( 'cellclick', this.onCellClick, this );
        store.addListener( 'load', this.onStoreLoaded, this );

        var config = Ext.apply( {}, config_in, { layout : 'fit', items : grid } );
        FileView.superclass.constructor.call( this, config );
    },

    refresh: function( torrent )
    {
        var stats = torrent.getFileStats();

        for( var i=0, n=stats.length; i<n; ++i ) {
            var record = this.findRecordFromFileIndex( i );
            if( record != null ) {
                record.set( 'wanted', stats[i].wanted );
                record.set( 'priority', stats[i].priority );
                record.set( 'bytesCompleted', stats[i].bytesCompleted );
            }
        }

        this.refreshBranches( );
    },

    refreshBranches: function( )
    {
        var records = this.fileStore.getRange( );

        for( var i=0, n=records.length; i<n; ++i )
        {
            var record = records[i];
            if( record.data._is_leaf )
                continue;

            record.set( 'wanted', this.isSubtreeWanted( record ) );
            record.set( 'priority', this.getPriority( record ) );
        }

        this.fileStore.commitChanges( );
    }
});

Ext.reg( 'fileview', FileView );
