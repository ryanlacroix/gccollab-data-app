# This file belongs to Chris Lavoie
# Github: Lavoiec

import sqlalchemy as sq
import time

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.automap import automap_base

from sqlalchemy import text
from sqlalchemy.orm import aliased
from sqlalchemy import or_


import pandas as pd


import datetime as dt
import getpass
import pickle

# TURN CONNECTION AND INITIALIZTION INTO CLASSES AND STUFF... CLASS


def convert_unixtime(stamp):

    return dt.datetime.fromtimestamp(
        int(stamp)
    ).strftime('%Y-%m-%d')


def convert_if_time(y):
    if 'id' not in y.name and (y.dtype == 'int64') and ('subtype' not in y.name):

        y = y.apply(lambda x: dt.datetime.fromtimestamp(x).strftime('%Y-%m-%d') if x >86399 else dt.datetime.fromtimestamp(86400))
        return y
    else:
        return y


def connect_to_database():
    global engine
    global conn

# Need to manually enter the username
# password, and the database to create a valid connection
    
    # Get credentials from pickle
    creds = pickle.load(open('creds.pkl', 'rb'))

    """
    username = getpass.getpass("Username")
    password = getpass.getpass("Password")
    database = getpass.getpass("Database")
    """

    username = creds['username']
    password = creds['password']
    database = creds['database']

    # Temporary. Add seperate file to pull this from
    

    db_connection = "mysql+pymysql://{}:{}@192.168.1.99:3306/{}".format(
        username, password, database)

    engine = sq.create_engine(db_connection, encoding='latin1', echo=False)

    conn = engine.connect()

    engine.connect()

    return engine, conn

    # Creates the link to GCconnex database


def create_session():

    global session
    global Base

    Session = sessionmaker(bind=engine)
    Session.configure(bind=engine)
    session = Session()

    # Maps the relationships
    Base = automap_base()
    Base.prepare(engine, reflect=True)

    return session, Base


class users(object):  # Pulls in the entire users database

    def get_all():  # Grabs entire table

        users_table = Base.classes.elggusers_entity
        entities_table = Base.classes.elggentities

        statement = session.query(
            users_table,
            entities_table.time_created
        )

        statement = statement.filter(entities_table.guid == users_table.guid)
        statement = statement.statement

        users = pd.read_sql(statement, conn)

        users = users.apply(convert_if_time)
        return users

    def filter_(filter_condition):
        users_session = session.query(users_table)
        users = pd.read_sql(
            users_session.filter(
                text("{}".format(filter_condition))
            ).statement, conn
        )

        

        return users

    def department():  # Issue : doesn't pull all members. That's bad.

        users_table = Base.classes.elggusers_entity
        entities_table = Base.classes.elggentities
        metadata_table = Base.classes.elggmetadata
        metastrings_table = Base.classes.elggmetastrings

        statement = session.query(
            users_table.guid,
            users_table.name,
            users_table.email,
            users_table.last_action,
            users_table.prev_last_action,
            users_table.last_login,
            users_table.prev_last_login,
            entities_table.time_created,
            metastrings_table.string
        )

        statement = statement.filter(metastrings_table.id == metadata_table.value_id)
        statement = statement.filter(metadata_table.name_id == 8667)
        statement = statement.filter(metadata_table.entity_guid == users_table.guid)
        statement = statement.filter(entities_table.guid == users_table.guid)
        statement = statement.statement

        users_department = pd.read_sql(statement, conn)

        users_department =users_department.apply(convert_if_time)

        return users_department


class groups(object):

    def name_from_guid(guid):
        groups_table = Base.classes.elgggroups_entity
        statement = session.query(groups_table)
        statement = statement.filter(groups_table.guid == guid)
        statement = statement.statement

        group_row = pd.read_sql(statement, conn)

        return group_row['name'].tolist()[0]

    def get_all(tags=False):

        if tags is False:

            groups_table = Base.classes.elgggroups_entity
            groups_query = session.query(groups_table).statement
            get_it_all = pd.read_sql(groups_query, conn)

            get_it_all = get_it_all.apply(convert_if_time)

            return get_it_all

        elif tags is True:

            groups_table = Base.classes.elgggroups_entity
            metadata_table = Base.classes.elggmetadata
            metastrings_table = Base.classes.elggmetastrings

            statement = session.query(
                groups_table,
                metadata_table,
                metastrings_table.string
            )

            # The tags features for groups are kept in the database as "interests"
            statement = statement.filter(groups_table.guid == metadata_table.entity_guid)
            statement = statement.filter(metadata_table.name_id == 59)
            statement = statement.filter(metadata_table.value_id == metastrings_table.id)

            statement = statement.statement

            get_it_all = pd.read_sql(statement, conn)
            get_it_all.drop(['id', 'value_id'], axis=1, inplace=True)

            tags = get_it_all[['name', 'string']]

            get_it_all = pd.DataFrame(tags.groupby('name')['string'].apply(list)).reset_index().merge(get_it_all.drop('string', axis=1).drop_duplicates(), on='name')

            get_it_all = get_it_all.apply(convert_if_time)
            return get_it_all

    def filter_(filter_condition):  # Allows for flexible SQL filters
        groups_table = Base.classes.elgggroups_entity
        groups_session = session.query(groups_table)

        groups_ = pd.read_sql(
            groups_session
            .filter(text("{}".format(filter_condition)))
            .statement, conn
        )
        groups_ = groups_.apply(convert_if_time)
        return groups_

    def get_group_members(guid):

        users_table = Base.classes.elggusers_entity
        groups_table = Base.classes.elgggroups_entity
        metadata_table = Base.classes.elggmetadata
        metastrings_table = Base.classes.elggmetastrings
        relationships_table = Base.classes.elggentity_relationships
        
        statement = session.query(
            users_table.name,
            users_table.guid,
            groups_table.name,
            groups_table.guid,
            relationships_table.time_created,
            metastrings_table.string
        )

        statement = statement.filter(users_table.guid == relationships_table.guid_one)
        statement = statement.filter(groups_table.guid == relationships_table.guid_two)

        statement = statement.filter(relationships_table.relationship == 'member')
        statement = statement.filter(metastrings_table.id == metadata_table.value_id)
        statement = statement.filter(metadata_table.name_id == 8667)
        statement = statement.filter(metadata_table.entity_guid == users_table.guid)
        statement = statement.filter(groups_table.guid == guid)

        statement = statement.statement

        get_all = pd.read_sql(statement, conn)

        get_all.columns = [
            'user_name',
            'user_guid',
            'group_name',
            'group_guid',
            'time_created',
            'department'
        ]

        get_all = get_all.apply(convert_if_time)

        return get_all


    def get_membership(department=False):

        users_table = Base.classes.elggusers_entity
        groups_table = Base.classes.elgggroups_entity
        metadata_table = Base.classes.elggmetadata
        metastrings_table = Base.classes.elggmetastrings
        relationships_table = Base.classes.elggentity_relationships

        if department is True:

            statement = session.query(
                users_table.name,
                users_table.guid,
                groups_table.name,
                groups_table.guid,
                relationships_table.time_created,
                metastrings_table.string
            )

            statement = statement.filter(users_table.guid == relationships_table.guid_one)
            statement = statement.filter(groups_table.guid == relationships_table.guid_two)

            statement = statement.filter(relationships_table.relationship == 'member')
            statement = statement.filter(metastrings_table.id == metadata_table.value_id)
            statement = statement.filter(metadata_table.name_id == 8667)
            statement = statement.filter(metadata_table.entity_guid == users_table.guid)

            statement = statement.statement

            get_all = pd.read_sql(statement, conn)

            get_all.columns = [
                'user_name',
                'user_guid',
                'group_name',
                'group_guid',
                'time_created',
                'department'
            ]

            get_all = get_all.apply(convert_if_time)

            return get_all

        else:

            statement = session.query(
                users_table.name,
                users_table.guid,
                groups_table.name,
                groups_table.guid,
                relationships_table.time_created
            )

            statement = statement.filter(users_table.guid == relationships_table.guid_one)
            statement = statement.filter(groups_table.guid == relationships_table.guid_two)

            statement = statement.filter(relationships_table.relationship == 'member')

            statement = statement.statement

            get_all = pd.read_sql(statement, conn)

            get_all.columns = [
                'user_name',
                'user_guid',
                'group_name',
                'group_guid',
                'time_created'
            ]

            get_all = get_all.apply(convert_if_time)
            return get_all

    def get_group_sizes():

        groups_table = Base.classes.elgggroups_entity
        relationships_table = Base.classes.elggentity_relationships
        statement = session.query(
            groups_table.name,
            relationships_table.guid_one
        )

        statement = statement.filter(
            groups_table.guid == relationships_table.guid_two
        )

        statement = statement.filter(
            relationships_table.relationship == 'member'
        )

        statement = statement.statement

        get_groups_sizes = pd.read_sql(statement, conn).groupby("name").count()

        get_groups_sizes = get_groups_sizes.apply(convert_if_time)

        return get_groups_sizes


class entities(object):

    def getall():

        entities_table = Base.classes.elggentities
        entities_query = session.query(entities_table).statement

        get_it_all = pd.read_sql(entities_query, conn)

        get_it_all = get_it_all.apply(convert_if_time)

        return get_it_all

    def filter_(filter_condition):

        entities_table = Base.classes.elggentities

        entities_session = session.query(entities_table)

        entities_ = pd.read_sql(
            entities_session.filter(
                text("{}".format(filter_condition))
            ).statement, conn
        )

        entities_ = entities_.apply(convert_if_time)

        return entities_


class metadata(object):

    def get_all():
        metadata_table = Base.classes.elggmetadata
        metadata_query = session.query(metadata_table).statement
        get_it_all = pd.read_sql(metadata_query, conn)

        get_it_all = get_it_all.apply(convert_if_time)

        return get_it_all

    def filter_(filter_condition):

        metadata_table = Base.classes.elggmetadata
        metadata_session = session.query(metadata_table)

        metadatas = pd.read_sql(
            metadata_session
            .filter(text("{}".format(filter_condition)))
            .statement, conn
        )

        metadatas = metadatas.apply(convert_if_time)

        return metadatas


class metastrings(object):

    def get_all():

        metastrings_table = Base.classes.elggmetastrings

        metastrings_query = session.query(metastrings_table).statement

        get_it_all = pd.read_sql(metastrings_query, conn)

        get_it_all = get_it_all.apply(convert_if_time)

        return get_it_all

    def filter_(filter_condition):

        metastrings_table = Base.classes.elggmetastrings

        metastrings_session = session.query(metastrings_table)

        metastring = pd.read_sql(metastrings_session
                .filter(text("{}".format(filter_condition)))
                .statement, conn
        )

        metastring = metastring.apply(convert_if_time)

        return metastring


class relationships(object):

    def get_all():

        relationships_table = Base.classes.elggentity_relationships

        relationships_query = session.query(relationships_table).statement

        get_it_all = pd.read_sql(relationships_query, conn)

        get_it_all = get_it_all.apply(convert_if_time)

        return get_it_all

    def filter_(filter_condition):

        relationships_table = Base.classes.elggentity_relationships
        relationships_session = session.query(relationships_table)

        relationship = pd.read_sql(
            relationships_session
            .filter(text("{}".format(filter_condition)))
            .statement, conn
        )

        relationship = relationship.apply(convert_if_time)

        return relationship


class annotations(object):

    def get_all():

        annotations_table = Base.classes.elggannotations

        annotations_query = session.query(annotations_table).statement

        get_it_all = pd.read_sql(annotations_query, conn)

        get_it_all = get_it_all.apply(convert_if_time)

        return get_it_all

    def filter_(filter_condition):

        annotations_table = Base.classes.elggannotations

        annotations_session = session.query(annotations_table)

        annotation = pd.read_sql(
            annotations_session
            .filter(text("{}".format(filter_condition)))
            .statement, conn
        )

        annotation = annotation.apply(convert_if_time)

        return annotation


class objectsentity(object):

    def get_all():

        objectsentity_table = Base.classes.elggobjects_entity

        objectsentity_query = session.query(objectsentity_table).statement

        get_it_all = pd.read_sql(objectsentity_query, conn)

        get_it_all = get_it_all.apply(convert_if_time)

        return get_it_all

    def filter_(filter_condition):

        objectsentity_table = Base.classes.elggobjects_entity

        objectsentity_session = session.query(objectsentity_table)

        elggobject = pd.read_sql(
            objectsentity_session
            .filter(text("{}".format(filter_condition)))
            .statement, conn
        )

        elggobject = elggobject.apply(convert_if_time)

        return elggobject


class micromissions(object):

    def get_users():

        users_table = Base.classes.elggusers_entity
        metadata_table = Base.classes.elggmetadata
        metastrings_table = Base.classes.elggmetastrings

        metastrings_table_2 = aliased(metastrings_table)
        metadata_table_2 = aliased(metadata_table)

        statement = session.query(
            users_table.guid,
            users_table.name,
            users_table.email,
            metadata_table.name_id,
            metadata_table.value_id,
            metadata_table_2.value_id,
            metadata_table.time_created,
            metastrings_table,
            metastrings_table_2
        )

        statement = statement.filter(users_table.guid == metadata_table.entity_guid)
        statement = statement.filter(metadata_table_2.entity_guid == users_table.guid)
        statement = statement.filter(metastrings_table.id == metadata_table.value_id)
        statement = statement.filter(metastrings_table_2.id == metadata_table_2.value_id)
        statement = statement.filter(metadata_table_2.name_id == 8667)
        statement = statement.filter(metadata_table.name_id == 1192767)

        statement = statement.statement
        get_it_all = pd.read_sql(statement, conn)
        get_it_all.columns = [
            'guid',
            'name',
            'email',
            'md1_name_id',
            'md1_value_id',
            'md2_value_id',
            'ms1_id',
            'time_created',
            'opt-in',
            'ms2_id',
            'department'
        ]

        get_it_all = get_it_all.apply(convert_if_time)

        return get_it_all

    def get_aggregate():

        metadata_table = Base.classes.elggmetadata
        metastrings_table = Base.classes.elggmetastrings

        statement = session.query(metastrings_table.string, metadata_table.entity_guid)
        statement = statement.filter(metastrings_table.id == metadata_table.value_id)

        statement = statement.filter(metadata_table.name_id == 1192767)

        statement = statement.statement

        get_it_all = pd.read_sql(statement, conn).groupby("string").count()
        get_it_all.columns = ['Count']
        return get_it_all

    def get_mission_data(summary=False):  # This needs to use the text query
                        # Since SQLAlchemy does not suppport IN statements well

        mission_data_string = """SELECT oe.guid guid,
         oe.title title,
         r.relationship relationship,
         ms.string state,
         ms2.string type,
         r.time_created time_of_relationship
        FROM elggobjects_entity oe,
        elggentity_relationships r,
        elggmetadata md, elggmetastrings ms,
        elggmetadata md2, elggmetastrings ms2
        WHERE oe.guid = r.guid_one
        AND r.guid_one IN (SELECT guid FROM elggentities WHERE subtype = 70)
        AND md.entity_guid = oe.guid
        AND ms.id = md.value_id
        AND md2.entity_guid = oe.guid
        AND md2.name_id = 1209635
        AND ms2.id = md2.value_id
        AND md.name_id = 126
        ORDER BY r.time_created"""

        get_data = pd.read_sql(mission_data_string, conn)
        get_data = get_data.apply(convert_if_time)

        if summary is True:
            get_data = pd.crosstab(
                get_data.type, get_data.relationship)

        return get_data


class content(object):

    def get_top_content(group_guid):
        """ Base query on this
        SELECT e.guid FROM elggentities e, elgggroups_entity g
        WHERE e.container_guid = g.guid
        AND g.name LIKE '%Business Number Adoption%' <- can use guid from url instead i think
        """

        entities_table = Base.classes.elggentities
        groupsentities_table = Base.classes.elgggroups_entity

        statement = session.query(entities_table, groupsentities_table)

        statement = statement.filter(entities_table.container_guid == groupsentities_table.guid)
        statement = statement.filter(groupsentities_table.guid == group_guid)

        statement = statement.statement

        top_content = pd.read_sql(statement, conn)
        top_content = top_content.apply(convert_if_time)
        top_content.columns = ['guid', 'type', 'subtype', 'owner_guid', 'site_guid', 'container_guid',
                'access_id', 'time_created', 'time_updated', 'last_action', 'enabled',
                'duplicate_check', 'group_guid', 'name', 'description']
        
        top_content = top_content[['guid']]
        return top_content
    
    def content_ga_query(group_guid):
        guid_df = get_top_content(group_guid)
        regex_str = ''
        l = content.values.astype(str).tolist()
        for i in range(len(l)):
            regex_str = regex_str + (l[i][0] + '|')
        return regex_str

    def get_blogs(tags=False):

        if tags is False:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity

            statement = session.query(entities_table, objectsentity_table)

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 5)

            statement = statement.statement

            get_blogs = pd.read_sql(statement, conn)

            get_blogs = get_blogs.apply(convert_if_time)
            return get_blogs

        elif tags is True:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity
            metadata_table = Base.classes.elggmetadata
            metastrings_table = Base.classes.elggmetastrings

            statement = session.query(
                entities_table.guid,
                entities_table.time_created,
                entities_table.container_guid,
                entities_table.owner_guid,
                objectsentity_table.title,
                objectsentity_table.description,
                metastrings_table.string
            )

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 5)
            statement = statement.filter(metadata_table.name_id == 119)
            statement = statement.filter(metadata_table.entity_guid == entities_table.guid)
            statement = statement.filter(metadata_table.value_id == metastrings_table.id)

            statement = statement.statement

            gdt = pd.read_sql(statement, conn)

            tags = gdt[['title', 'string']]

            get_blogs = pd.DataFrame(tags.groupby('title')['string'].apply(list)).reset_index().merge(gdt.drop('string', axis = 1).drop_duplicates(), on = 'title')

            get_blogs = get_blogs.apply(convert_if_time)

            return get_blogs


    def get_discussions_with_users(tags = False):
        # This now retrieves usernames and email addresses as well
        # Use this later to make assumptions about the department of this user
        if tags is False:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity
            # User table added
            users_table = Base.classes.elggusers_entity

            statement = session.query(entities_table, objectsentity_table, users_table)
            #statement = session.query(entities_table, users_table)

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.owner_guid == users_table.guid)
            statement = statement.filter(entities_table.subtype == 7)

            # Still needs to join the departments
            # Run the guess_departments script first,
            # Join result of guess_departments with results of this function
            
            statement = statement.statement

            # This is taking ~35s
            start = time.time()
            get_discussions = pd.read_sql(statement, conn)
            end = time.time()
            print("Time to retrieve from db: " + str(end - start) + " seconds.")

            get_discussions = get_discussions.apply(convert_if_time)
            get_discussions.to_csv('discussions_with_users.csv')

            return get_discussions

    def get_discussions(tags=False):

        if tags is False:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity

            statement = session.query(entities_table, objectsentity_table)

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 7)

            statement = statement.statement

            # This is taking ~35s
            start = time.time()
            get_discussions = pd.read_sql(statement, conn)
            end = time.time()
            print("Time to retrieve from db: " + str(end - start) + " seconds.")

            get_discussions = get_discussions.apply(convert_if_time)

            return get_discussions

        elif tags is True:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity
            metadata_table = Base.classes.elggmetadata
            metastrings_table = Base.classes.elggmetastrings

            statement = session.query(
                entities_table.guid,
                entities_table.time_created,
                entities_table.container_guid,
                objectsentity_table.title,
                objectsentity_table.description, metastrings_table.string
            )

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 7)
            statement = statement.filter(metadata_table.name_id == 119)
            statement = statement.filter(metadata_table.entity_guid == entities_table.guid)
            statement = statement.filter(metadata_table.value_id == metastrings_table.id)

            statement = statement.statement

            gdt = pd.read_sql(statement, conn)

            tags = gdt[['title', 'string']]

            get_discussions = pd.DataFrame(tags.groupby('title')['string'].apply(list)).reset_index().merge(gdt.drop('string', axis = 1).drop_duplicates(), on = 'title')

            get_discussions = get_discussions.apply(convert_if_time)

            return get_discussions

    def get_files(tags=False):

        if tags is False:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity

            statement = session.query(entities_table, objectsentity_table)

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 1)

            statement = statement.statement

            get_files = pd.read_sql(statement, conn)

            get_files = get_files.apply(convert_if_time)

            return get_files

        elif tags is True:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity
            metadata_table = Base.classes.elggmetadata
            metastrings_table = Base.classes.elggmetastrings

            statement = session.query(
                entities_table.guid,
                entities_table.time_created,
                entities_table.container_guid,
                objectsentity_table.title,
                objectsentity_table.description,
                metastrings_table.string
            )

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 1)
            statement = statement.filter(metadata_table.name_id == 119)
            statement = statement.filter(metadata_table.entity_guid == entities_table.guid)
            statement = statement.filter(metadata_table.value_id == metastrings_table.id)

            statement = statement.statement

            gdt = pd.read_sql(statement, conn)

            tags = gdt[['title', 'string']]

            get_files = pd.DataFrame(tags.groupby('title')['string'].apply(list)).reset_index().merge(gdt.drop('string', axis = 1).drop_duplicates(), on = 'title')

            get_files = get_files.apply(convert_if_time)
            return get_files

    def get_bookmarks(tags=False):

        if tags is False:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity

            statement = session.query(entities_table, objectsentity_table)

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 8)

            statement = statement.statement

            get_bookmarks = pd.read_sql(statement, conn)

            get_bookmarks = get_bookmarks.apply(convert_if_time)

            return get_bookmarks

        elif tags is True:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity
            metadata_table = Base.classes.elggmetadata
            metastrings_table = Base.classes.elggmetastrings

            statement = session.query(
                entities_table.guid,
                entities_table.time_created,
                entities_table.container_guid,
                objectsentity_table.title,
                objectsentity_table.description,
                metastrings_table.string
            )

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 8)
            statement = statement.filter(metadata_table.name_id == 119)
            statement = statement.filter(metadata_table.entity_guid == entities_table.guid)
            statement = statement.filter(metadata_table.value_id == metastrings_table.id)

            statement = statement.statement

            gdt = pd.read_sql(statement, conn)

            tags = gdt[['title', 'string']]

            get_bookmarks = pd.DataFrame(tags.groupby('title')['string'].apply(list)).reset_index().merge(gdt.drop('string', axis = 1).drop_duplicates(), on = 'title')
            get_bookmarks = get_bookmarks.apply(convert_if_time)

            return get_bookmarks

    def get_ideas(tags=False):

        if tags is False:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity

            statement = session.query(entities_table, objectsentity_table)

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 42)
            statement = statement.statement
            get_ideas = pd.read_sql(statement, conn)
            get_ideas = get_ideas.apply(convert_if_time)

            return get_ideas

        elif tags is True:

            entities_table = Base.classes.elggentities
            objectsentity_table = Base.classes.elggobjects_entity
            metadata_table = Base.classes.elggmetadata
            metastrings_table = Base.classes.elggmetastrings

            statement = session.query(
                entities_table.guid,
                entities_table.time_created,
                entities_table.container_guid,
                objectsentity_table.title,
                objectsentity_table.description,
                metastrings_table.string
            )

            statement = statement.filter(entities_table.guid == objectsentity_table.guid)
            statement = statement.filter(entities_table.subtype == 42)
            statement = statement.filter(metadata_table.name_id == 119)
            statement = statement.filter(metadata_table.entity_guid == entities_table.guid)
            statement = statement.filter(metadata_table.value_id == metastrings_table.id)

            statement = statement.statement

            gdt = pd.read_sql(statement, conn)

            tags = gdt[['title', 'string']]

            get_ideas = pd.DataFrame(tags.groupby('title')['string'].apply(list)).reset_index().merge(gdt.drop('string', axis = 1).drop_duplicates(), on = 'title')
            get_ideas = get_ideas.apply(convert_if_time)
            return get_ideas

    def get_comments():
        entities_table = Base.classes.elggentities
        objectsentity_table = Base.classes.elggobjects_entity

        statement = session.query(
            entities_table.guid,
            entities_table.owner_guid,
            entities_table.time_created,
            entities_table.container_guid,
            entities_table.subtype,
            objectsentity_table.title,
            objectsentity_table.description
        )
        statement = statement.filter(
            entities_table.guid == objectsentity_table.guid)

        statement = statement.filter(or_(
            entities_table.subtype == 66, entities_table.subtype == 64))

        statement = statement.statement

        comments = pd.read_sql(statement, conn)

        return comments