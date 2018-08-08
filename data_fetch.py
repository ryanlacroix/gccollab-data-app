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

# Get the group's guid from the URL


def get_group_guid(urlString):
    url2 = urlString[urlString.find('profile/'):]
    url3 = url2[url2.find('/')+1:]
    return url3[:url3.find('/')]

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
        gc.connect_to_database()
        gc.create_session()
        url = req_obj['filter']
        url2 = url[url.find('profile/'):]
        url3 = url2[url2.find('/')+1:]
        group_guid = url3[:url3.find('/')]
        group_name = gc.groups.name_from_guid(group_guid)
        return group_name

def get_pageviews(req_obj):
    ga = gcga()
    try:
        ga.set_platform(req_obj['platform'])
    except:
        ga.set_platform('gccollab')
    url = req_obj['url']
    group_name = get_group_name(url, req_obj)
    # Request a dataframe containing pageviews and corresponding dates
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

    # Figure out group guid from url
    url = req_obj['url']
    url2 = url[url.find('profile/'):]
    url3 = url2[url2.find('/')+1:]
    group_guid = url3[:url3.find('/')]

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
        if req_obj['stat'] == 'pageviews':
            get_pageviews(req_obj)
        elif req_obj['stat'] == 'topContent':
            get_group_top_content(req_obj)
        elif req_obj['stat'] == 'membersOverTime':  # Number of members
            get_group_members_over_time(req_obj)
        elif req_obj['stat'] == 'membersByDepartment':  # Group members by department
            get_group_members_by_department(req_obj)
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
    inStr = '{"type":"pages","stat":"pageviews","url":"https://gcconnex.gc.ca/groups/profile/31045361/temporary-resident-program-delivery-functional-direction-division-de-lexecution-du-programme-des-residents-temporaires-orientation-fonctionelle?language=en","start_date":"2018-04-20","end_date":"2018-07-19"}'
    inStr = '{"platform": "gcconnex", "type":"pages","stat":"pageviews","url":"https://gcconnex.gc.ca/groups/profile/31045361/temporary-resident-program-delivery-functional-direction-division-de-lexecution-du-programme-des-residents-temporaires-orientation-fonctionelle","start_date":"2018-04-20","end_date":"2018-08-02"}'
    inStr = '{"platform": "gcconnex", "type":"pages","stat":"avgTimeOnPage","url":"https://gcconnex.gc.ca/groups/profile/31045361/temporary-resident-program-delivery-functional-direction-division-de-lexecution-du-programme-des-residents-temporaires-orientation-fonctionelle","start_date":"2018-04-20","end_date":"2018-08-02"}'
    inStr = '{"platform": "gcconnex", "type":"pages","stat":"avgTimeOnPage","url":"https://gcconnex.gc.ca/groups/profile/19980634/welcome-to-gcconnex-bienvenue-a-gcconnex","start_date":"2018-04-20","end_date":"2018-08-02"}'
    main()
    # If collab db was used be sure to close the tunnel properly
    try:
        gc.close_tunnel()
    except:
        pass
    sys.exit()
