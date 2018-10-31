import sys
import json
import numpy as np
import pandas as pd
import gccollab as gc
from gcga import gcga
import code
import datetime
import sqlalchemy

# This script returns data by printing to stdout

# Group subpage urls containing group guid
simple_pages = [
    '/file/group/',
    '/event_calendar/group/',
    '/bookmarks/group/',
    '/blog/group/',
    '/discussion/owner/',
    '/event_calendar/group/',
    '/docs/group/',
    '/polls/group/',
    '/photos/group/',
    '/ideas/group/',
    '/groups/related/'
]

# Get the group's guid from the URL
def get_group_guid(urlString):
    group_guid = ''
    url2 = urlString[urlString.find('profile/'):]
    url3 = url2[url2.find('/')+1:]
    # Account for urls without trailing forward slash
    if url3.find('/') != -1:
        group_guid = url3[:url3.find('/')]
    else:
        group_guid = url3
    return group_guid

def check_for_subpage(url):
    subpage = False
    for type_url in simple_pages:
        if type_url in url:
            subpage = True
    print(json.dumps({'subpage': subpage, 'guid': get_group_guid_from_subpage(url)}))

def get_group_guid_from_subpage(urlString):
    guid = ''
    # These pages include the group guid in the url
    simple_pages = [
        '/file/group/',
        '/event_calendar/group/',
        '/bookmarks/group/',
        '/blog/group/',
        '/discussion/owner/',
        '/event_calendar/group/',
        '/docs/group/',
        '/polls/group/',
        '/photos/group/',
        '/ideas/group/',
        '/groups/related/'
    ]
    # Remove the domain
    guid = urlString.replace('https://gccollab.ca', '').replace('https://gcconnex.ca', '')
    complex_page = True # This switches off if the page is found to be simple
    for type_url in simple_pages:
        if type_url in guid:
            complex_page = False
            guid = guid.replace(type_url,'')
    if complex_page == True:
        # Extract this content's guid and hit the db for containing group guid
        pass # For now. Will add this after front end for this feature is good
    if guid.find('/all') != -1:
        guid = guid[:guid.find('/all')]
    guid = guid.replace('/top','').replace('/','')
    return guid

# Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    # Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def get_group_name(urlString, req_obj):
    try:
        url2 = urlString[urlString.find('profile/'):]
        url3 = url2[url2.find('/')+1:]
        url4 = url3[url3.find('/')+1:]
        return url4
    except:
        return get_group_name_db(req_obj, write=False)
        
def get_group_name_db(req_obj, write=True):
    gc.connect_to_database()
    gc.create_session()
    url = req_obj['url']
    url2 = url[url.find('profile/'):]
    url3 = url2[url2.find('/')+1:]
    group_guid = url3[:url3.find('/')]
    group_name = gc.groups.name_from_guid(group_guid)
    if write == False:
        return group_name
    else:
        print(json.dumps({'name':group_name}))

def get_pageviews(req_obj):
    ga = gcga()
    try:
        ga.set_platform(req_obj['platform'])
    except:
        ga.set_platform('gccollab')
    url = req_obj['url']
    group_name = get_group_name(url, req_obj)
    # Determine whether request is asking for group name as well
    get_name = {}
    try:
        get_name = req_obj['getName']
    except:
        get_name = False
    # Request a dataframe containing pageviews and corresponding dates
    # Needs parameter that throws in the group name to the return object
    ret = ga.pageviews([req_obj['url'], 'NOToffset'], intervals=True,
                       start_date=req_obj['start_date'], end_date=req_obj['end_date'])
    ret['group_name'] = group_name
    print(json.dumps(ret))

def get_unique_pageviews(req_obj):
    ga = gcga()
    try:
        ga.set_platform(req_obj['platform'])
    except:
        ga.set_platform('gccollab')
    # Request a dataframe containing pageviews and corresponding dates
    ret = ga.get_stats([req_obj['url'], 'NOToffset'], intervals=True,
                       start_date=req_obj['start_date'], end_date=req_obj['end_date'], metric='uniquePageviews')
    print(json.dumps(ret))


def get_avg_time_on_page(req_obj):
    ga = gcga()
    try:
        ga.set_platform(req_obj['platform'])
    except:
        ga.set_platform('gccollab')
    ret = ga.avg_time_on_page(
        req_obj['url'], start_date=req_obj['start_date'], end_date=req_obj['end_date'])
    print(json.dumps({'avgTime': ret}))


def get_group_top_content(req_obj):
    # Establish database connection
    gc.connect_to_database()
    gc.create_session()
    
    group_guid = get_group_guid(req_obj['url'])
    
    # Get the guids of all content within group
    guid_list = gc.content.get_top_content(group_guid)

    # Get the clean group name from the guid
    group_name = gc.groups.name_from_guid(group_guid)

    # Build regex string from guids
    regex_str = ''
    if len(guid_list) == 0:
        # If no content is found create an unmatchable string
        regex_str = 'a^'
    else:
        l = guid_list.values.astype(str).tolist()
        for i in range(len(l)):
            # ADD FIX TO GCCONNEX
            regex_str = regex_str + ('/' + l[i][0] + '/|')
        # Remove trailing pipe
        regex_str = regex_str[:-1]

    # Send google analytics request with regex string
    ga = gcga()
    ga.set_platform('gccollab')
    ret = ga.content_views(regex_str)

    # Format results and print to stdout
    ret['group_name'] = group_name
    print(json.dumps(ret))


def get_group_members_over_time(req_obj):
    # Establish database connection
    gc.connect_to_database()
    gc.create_session()

    # Determine group guid
    group_guid = get_group_guid(req_obj['url'])

    # Query the database
    group_members = gc.groups.get_group_members(group_guid, cleaned=False)
    group_name = gc.groups.name_from_guid(group_guid)

    # Get mungin'
    # Convert times to datetime objects
    group_members['time_created'] = group_members['time_created'].apply(
        lambda x: pd.to_datetime(x))

    group_members.set_index('time_created', inplace=True)

    group_members = group_members[group_members.index >
                                  pd.to_datetime('2000-01-01')]

    # Daily
    group_members_daily = group_members['user_name'].groupby(
        pd.TimeGrouper(freq='D')).count().cumsum()
    group_members_daily = group_members_daily.reset_index()

    # If the requested start date predates the dataframe, pad with 0s
    if min(group_members_daily['time_created']) > pd.to_datetime(req_obj['start_date']):
        ix = pd.DatetimeIndex(start=pd.to_datetime(req_obj['start_date']), end=max(
            group_members_daily['time_created']), freq='D')
        group_members_daily = group_members_daily.set_index(
            'time_created').reindex(ix, fill_value=0).reset_index()
        group_members_daily.rename(
            columns={'index': 'time_created'}, inplace=True)

    # If the requested end date is after the end of the dataframe, pad with last value
    if max(group_members_daily['time_created']) < pd.to_datetime(req_obj['end_date']):
        ix = pd.DatetimeIndex(start=pd.to_datetime(
            req_obj['start_date']), end=pd.to_datetime(req_obj['end_date']), freq='D')
        group_members_daily = group_members_daily.set_index('time_created').reindex(
            ix, fill_value=max(group_members_daily['user_name'])).reset_index()
        group_members_daily.rename(
            columns={'index': 'time_created'}, inplace=True)

    # Only keep current time selection
    group_members_daily = group_members_daily[group_members_daily['time_created'] >= pd.to_datetime(
        req_obj['start_date'])]
    group_members_daily = group_members_daily[group_members_daily['time_created'] <= pd.to_datetime(
        req_obj['end_date'])]

    group_members_daily['time_created'] = group_members_daily['time_created'].apply(
        lambda x: x.strftime('%Y%m%d'))

    # Monthly
    group_members_monthly = group_members['user_name'].groupby(
        pd.TimeGrouper(freq='M')).count().cumsum()
    group_members_monthly = group_members_monthly.reset_index()

    # (monthly) If the requested start date predates the oldest time on the dataframe, pad with 0s
    if min(group_members_monthly['time_created']) > pd.to_datetime(req_obj['start_date']):
        ix = pd.DatetimeIndex(start=pd.to_datetime(req_obj['start_date']), end=max(
            group_members_monthly['time_created']), freq='M')
        group_members_monthly = group_members_monthly.set_index(
            'time_created').reindex(ix, fill_value=0).reset_index()
        group_members_monthly.rename(
            columns={'index': 'time_created'}, inplace=True)

    # If the requested end date is after the end of the dataframe, pad with last value
    if max(group_members_monthly['time_created']) < pd.to_datetime(req_obj['end_date']):
        ix = pd.DatetimeIndex(start=pd.to_datetime(
            req_obj['start_date']), end=pd.to_datetime(req_obj['end_date']), freq='M')
        group_members_monthly = group_members_monthly.set_index('time_created').reindex(
            ix, fill_value=max(group_members_monthly['user_name'])).reset_index()
        group_members_monthly.rename(
            columns={'index': 'time_created'}, inplace=True)

    # Only keep current time selection
    group_members_monthly = group_members_monthly[group_members_monthly['time_created'] >= pd.to_datetime(
        req_obj['start_date'])]
    group_members_monthly = group_members_monthly[group_members_monthly['time_created'] <= pd.to_datetime(
        req_obj['end_date'])]

    group_members_monthly['time_created'] = group_members_monthly['time_created'].apply(
        lambda x: x.strftime('%Y%m%d'))

    send_obj = {
        'monthly': {
            'dates': group_members_monthly['time_created'].values.tolist(),
            'users': group_members_monthly['user_name'].values.tolist()
        },
        'daily': {
            'dates': group_members_daily['time_created'].values.tolist(),
            'users': group_members_daily['user_name'].values.tolist(),
        },
        'group_name': group_name
    }

    print(json.dumps(send_obj))


def get_group_members_by_department(req_obj):
    gc.connect_to_database()
    gc.create_session()

    # Determine group guid
    group_guid = get_group_guid(req_obj['url'])

    members = gc.groups.get_group_members(group_guid)

    # The index used below could be any column, not important
    members = members.groupby('department').count().reset_index().set_index(
        'time_created').sort_index(ascending=False).reset_index()

    send_obj = {
        'departments': members['department'].values.tolist(),
        'members': members['time_created'].values.tolist()
    }
    print(json.dumps(send_obj))


def main(testing=False):
    # Get JSON object from stdin
    if testing == False:
        req_obj = read_in()
    else:
        req_obj = json.loads(testing)

    # Start parsing the request.
    if req_obj['type'] == 'groups':
        if req_obj['stat'] == 'is_subpage':
            check_for_subpage(req_obj['url'])
        elif req_obj['stat'] == 'pageviews':
            get_pageviews(req_obj)
        elif req_obj['stat'] == 'topContent':
            get_group_top_content(req_obj)
        elif req_obj['stat'] == 'membersOverTime':  # Number of members
            get_group_members_over_time(req_obj)
        elif req_obj['stat'] == 'membersByDepartment':  # Group members by department
            get_group_members_by_department(req_obj)
        elif req_obj['stat'] == 'groupName':
            get_group_name_db(req_obj)
        else:
            print('Query incorrectly formed.')
    elif req_obj['type'] == 'pages':
        if req_obj['stat'] == 'pageviews':
            get_pageviews(req_obj)
        elif req_obj['stat'] == 'avgTimeOnPage':
            get_avg_time_on_page(req_obj)
        elif req_obj['stat'] == 'uniquePageviews':
            get_unique_pageviews(req_obj)

# Start process
if __name__ == '__main__':
    inStr = '{"type":"pages","stat":"uniquePageviews","url":"https://gccollab.ca//profile/103347/esdc-innovation-lab-lab-dinnovation-demploi-et-developpement-social-canada","start_date":"2018-04-20","end_date":"2018-07-19"}'
    main()
    # If collab db was used be sure to close the tunnel properly
    try:
        gc.close_tunnel()
    except:
        pass
    sys.exit()
