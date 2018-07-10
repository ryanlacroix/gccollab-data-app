import sys, json, numpy as np
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

#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    #Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def main(testing=False):
    # Get JSON object from stdin
    if testing == False:
        req_obj = read_in()
    else:
        req_obj = json.loads(testing)

    # Pick apart request object
    req_type = req_obj['reqType']
    metric = req_obj['metric']
    metric2 = req_obj['metric2']
    start_time = req_obj['time']['startDate']
    end_time = req_obj['time']['endDate']
    all_time = req_obj['time']['allTime']

    # Start parsing the request.
    # Type
    if req_type['category'] == 1: # Groups
        url = req_type['filter']
        if metric == 1: # Pageviews
            ga = gcga()
            ga.set_platform('gccollab')
            # Request a dataframe containing pageviews and corresponding dates
            ret = ga.pageviews([url, 'NOToffset'], intervals=True, start_date=start_time, end_date=end_time)
            print(json.dumps(ret))

        elif metric == 2: # Top content
            # Establish database connection
            gc.connect_to_database()
            gc.create_session()

            # Figure out group guid from url
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
                    regex_str = regex_str + ('/' + l[i][0] + '/|')# ADD FIX TO GCCONNEX
                # Remove trailing pipe
                regex_str = regex_str[:-1]
            
            # Send google analytics request with regex string
            ga = gcga()
            ga.set_platform('gccollab')
            ret = ga.content_views(regex_str)

            # Format results and print to stdout
            ret['group_name'] = group_name
            print(json.dumps(ret))

        elif metric == 3: # Number of members
            # Establish database connection
            gc.connect_to_database()
            gc.create_session()
            
            # Determine group guid
            group_guid = get_group_guid(url)

            # Query the database
            group_members = gc.groups.get_group_members(group_guid, cleaned=False)
            group_name = gc.groups.name_from_guid(group_guid)
 
            # Get mungin'
            # Convert times to datetime objects
            group_members['time_created'] = group_members['time_created'].apply(lambda x: pd.to_datetime(x))

            group_members.set_index('time_created', inplace=True)
            
            group_members = group_members[group_members.index > pd.to_datetime('2000-01-01')]

            # Daily
            group_members_daily = group_members['user_name'].groupby(pd.TimeGrouper(freq='D')).count().cumsum()
            group_members_daily = group_members_daily.reset_index()

            # If the requested start date predates the dataframe, pad with 0s
            if min(group_members_daily['time_created']) > pd.to_datetime(start_time):
                ix = pd.DatetimeIndex(start=pd.to_datetime(start_time), end=max(group_members_daily['time_created']), freq='D')
                group_members_daily = group_members_daily.set_index('time_created').reindex(ix, fill_value=0).reset_index()
                group_members_daily.rename(columns={'index': 'time_created'}, inplace=True)

            # If the requested end date is after the end of the dataframe, pad with last value
            if max(group_members_daily['time_created']) < pd.to_datetime(end_time):
                ix = pd.DatetimeIndex(start=pd.to_datetime(start_time), end= pd.to_datetime(end_time), freq='D')
                group_members_daily = group_members_daily.set_index('time_created').reindex(ix, fill_value=max(group_members_daily['user_name'])).reset_index()
                group_members_daily.rename(columns={'index': 'time_created'}, inplace=True)
                
            # Only keep current time selection
            group_members_daily = group_members_daily[group_members_daily['time_created'] >= pd.to_datetime(start_time)]
            group_members_daily = group_members_daily[group_members_daily['time_created'] <= pd.to_datetime(end_time)]

            group_members_daily['time_created'] = group_members_daily['time_created'].apply(lambda x: x.strftime('%Y%m%d'))
            
            # Monthly
            group_members_monthly = group_members['user_name'].groupby(pd.TimeGrouper(freq='M')).count().cumsum()
            group_members_monthly = group_members_monthly.reset_index()
            
            # (monthly) If the requested start date predates the oldest time on the dataframe, pad with 0s
            if min(group_members_monthly['time_created']) > pd.to_datetime(start_time):
                ix = pd.DatetimeIndex(start=pd.to_datetime(start_time), end=max(group_members_monthly['time_created']), freq='M')
                group_members_monthly = group_members_monthly.set_index('time_created').reindex(ix, fill_value=0).reset_index()
                group_members_monthly.rename(columns={'index': 'time_created'}, inplace=True)
            
            # If the requested end date is after the end of the dataframe, pad with last value
            if max(group_members_monthly['time_created']) < pd.to_datetime(end_time):
                ix = pd.DatetimeIndex(start=pd.to_datetime(start_time), end= pd.to_datetime(end_time), freq='M')
                group_members_monthly = group_members_monthly.set_index('time_created').reindex(ix, fill_value=max(group_members_monthly['user_name'])).reset_index()
                group_members_monthly.rename(columns={'index': 'time_created'}, inplace=True)
            
            # Only keep current time selection
            group_members_monthly = group_members_monthly[group_members_monthly['time_created'] >= pd.to_datetime(start_time)]
            group_members_monthly = group_members_monthly[group_members_monthly['time_created'] <= pd.to_datetime(end_time)]

            group_members_monthly['time_created'] = group_members_monthly['time_created'].apply(lambda x: x.strftime('%Y%m%d'))
            
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

        elif metric == 4: # Group members by department
            gc.connect_to_database()
            gc.create_session()
            
            # Determine group guid
            group_guid = get_group_guid(url)

            members = gc.groups.get_group_members(group_guid)
            
            # The index used below could be any column, not important
            members = members.groupby('department').count().reset_index().set_index('time_created').sort_index(ascending=False).reset_index()

            send_obj = {
                'departments': members['department'].values.tolist(),
                'members': members['time_created'].values.tolist() 
            }
            print(json.dumps(send_obj))

    elif req_type['category'] == 2: # Users
        if req_type['filter'] == 1: # All users
            # This is for both 'Registered users' and 'Active users' queries.
            # (The queries only differ by one line)

            gc.connect_to_database()
            gc.create_session()

            users = gc.users.get_all()
            users['time_created'] = users['time_created'].apply(lambda x: pd.to_datetime(x))

            # Get monthly totals
            monthly = users.set_index('time_created').groupby(pd.TimeGrouper(freq='M')).count().cumsum().reset_index()[['time_created', 'email']]
            monthly['time_created'] = monthly['time_created'].apply(lambda x: x.strftime('%Y%m%d'))

            # Get daily totals
            daily = users.set_index('time_created').groupby(pd.TimeGrouper(freq='D')).count().cumsum().reset_index()[['time_created', 'email']]
            daily['time_created'] = daily['time_created'].apply(lambda x: x.strftime('%Y%m%d'))

            send_obj = {
                'monthly': {
                    'dates': monthly['time_created'].values.tolist(),
                    'users': monthly['email'].values.tolist()
                },
                'daily': {
                    'dates': daily['time_created'].values.tolist(),
                    'users': daily['email'].values.tolist()
                }
            }
            print(json.dumps(send_obj))

        elif req_type['filter'] == 2: # Users from a particular department
            if metric2 == 1: # Number of users from particular department
                gc.connect_to_database()
                gc.create_session()

                users = gc.users.department()
                users['time_created'] = users['time_created'].apply(lambda x: pd.to_datetime(x))

                # Only keep users from indicated department
                # Need to import that list of deps to parse the number from
                dep_list = []
                with open('en_dpts.json') as depts:
                    depts_dict = json.load(depts)
                    for dep in depts_dict.values():
                        dep_list.append(dep)
                # Figure out the corresponding index
                dep = dep_list[metric]

                users = users[users['string'].str.contains(dep)]

                # Get monthly totals
                monthly = users.set_index('time_created').groupby(pd.TimeGrouper(freq='M')).count().cumsum().reset_index()[['time_created', 'email']]
                monthly['time_created'] = monthly['time_created'].apply(lambda x: x.strftime('%Y%m%d'))

                # Get daily totals
                daily = users.set_index('time_created').groupby(pd.TimeGrouper(freq='D')).count().cumsum().reset_index()[['time_created', 'email']]
                daily['time_created'] = daily['time_created'].apply(lambda x: x.strftime('%Y%m%d'))

                send_obj = {
                    'monthly': {
                        'dates': monthly['time_created'].values.tolist(),
                        'users': monthly['email'].values.tolist()
                    },
                    'daily': {
                        'dates': daily['time_created'].values.tolist(),
                        'users': daily['email'].values.tolist()
                    }
                }
                print(json.dumps(send_obj))
            elif metric2 == 2: # Users opted in to oppurtunities platform from particular department
                gc.connect_to_database()
                gc.create_session()

                users = gc.micromissions.get_users()

                dep_list = []
                with open('en_dpts.json') as depts:
                    depts_dict = json.load(depts)
                    for dep in depts_dict.values():
                        dep_list.append(dep)
                # Figure out the corresponding index
                dep = dep_list[metric]

                users = users[users['department'].str.contains(dep)]
                users = users[users['opt-in'].str.contains('yes')]

                # Get monthly totals
                monthly = users.set_index('time_created').groupby(pd.TimeGrouper(freq='M')).count().cumsum().reset_index()[['time_created', 'email']]
                monthly['time_created'] = monthly['time_created'].apply(lambda x: x.strftime('%Y%m%d'))

                # Get daily totals
                daily = users.set_index('time_created').groupby(pd.TimeGrouper(freq='D')).count().cumsum().reset_index()[['time_created', 'email']]
                daily['time_created'] = daily['time_created'].apply(lambda x: x.strftime('%Y%m%d'))

                send_obj = {
                    'monthly': {
                        'dates': monthly['time_created'].values.tolist(),
                        'users': monthly['email'].values.tolist()
                    },
                    'daily': {
                        'dates': daily['time_created'].values.tolist(),
                        'users': daily['email'].values.tolist()
                    }
                }
                print(json.dumps(send_obj))

# Clean dataframes for serialization
def clean_df(df):
    for key in df.keys():
        if type(key) is not str:
            try:
                df[str(key)] = df[key]
            except:
                try:
                    df[repr(key)] = df[key]
                except:
                    pass
            del df[key]
    return df

#start process
if __name__ == '__main__':
    # Testing users / all users
    #inStr = '{"stepIndex":4,"reqType":{"category":2,"filter":1},"metric":2,"time":{"startDate":"2017-01-07","endDate":"2018-01-07","allTime":true}}'
    #inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gcconnex.gc.ca/newsfeed/"},"metric":1,"time":{"startDate":"","endDate":"","allTime":false}}'
    #inStr = '{"stepIndex":4,"reqType":{"category":2,"filter":1},"metric":1,"time":{"startDate":"","endDate":"","allTime":false}}'
    
    # Testing the group members route
    #inStr = '{"stepIndex":4,"reqType":{"category":2,"filter":1},"metric":2,"time":{"startDate":"2017-01-24","endDate":"2018-01-24","allTime":false}}'
    #inStr = '{"stepIndex":4,"reqType":{"category":2,"filter":2},"metric":1,"time":{"startDate":"2017-01-25","endDate":"2018-01-25","allTime":false}}'
    

    # Group pageviews
    #inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/110891/gctools-team-private-group-groupe-prive-de-lequipe-des-outilsgc"},"metric":1,"metric2":0,"time":{"startDate":"2017-01-12","endDate":"2018-02-23","allTime":false}}'
    
    # pageviews test
    inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/85014/the-policy-community-la-communaute-des-politiques"},"metric":1,"metric2":0,"time":{"startDate":"2017-01-12","endDate":"2018-02-23","allTime":false}}'
    
    # Group members by department
    inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/29660/canada-beyond-150-canada-au-dela-de-150"},"metric":4,"metric2":0,"time":{"startDate":"2017-01-12","endDate":"2018-01-12","allTime":false}}'

    # Number of group members
    #inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/110891/gctools-team-private-group-groupe-prive-de-lequipe-des-outilsgc"},"metric":3,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}'
    
    # Top group content
    inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/718/canada-indigenous-relations-creating-awareness-fostering-reconciliation-and-contributing-to-a-shared-future-relations-canada-et-peuples-indigenes-promouvoir-la-sensibilisation-favoriser-la-reconciliation-et-contribuer-a-un-avenir-partager"},"metric":2,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}'
    
    # Broken group membership
    inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/11735/immigration-canadienne-et-integration-en-milieu-de-travail"},"metric":3,"metric2":0,"time":{"startDate":"2018-03-30","endDate":"2018-06-28","allTime":true},"errorFlag":false}'
    
    # Broken top content
    #inStr = '{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/11735/immigration-canadienne-et-integration-en-milieu-de-travail"},"metric":2,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}'
    
    main()
    # If collab db was used be sure to close the tunnel properly
    try:
        gc.close_tunnel()
    except:
        pass
    sys.exit()