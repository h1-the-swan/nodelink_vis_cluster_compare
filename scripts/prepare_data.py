import sys, os, time, json
from datetime import datetime
from timeit import default_timer as timer
try:
    from humanfriendly import format_timespan
except ImportError:
    def format_timespan(seconds):
        return "{:.2f} seconds".format(seconds)

import pandas as pd
import numpy as np
import networkx as nx
from networkx.readwrite import json_graph

import logging
logging.basicConfig(format='%(asctime)s %(name)s.%(lineno)d %(levelname)s : %(message)s',
        datefmt="%H:%M:%S",
        level=logging.INFO)
# logger = logging.getLogger(__name__)
logger = logging.getLogger('__main__').getChild(__name__)

# https://stackoverflow.com/questions/27050108/convert-numpy-type-to-python/27050186#27050186
class MyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return super(MyEncoder, self).default(obj)

def get_list_of_papers(df, attr_names=['title']):
    """
    Given a dataframe with index representing paper IDs,
    return a list of papers as dictionaries.
    E.g., if attr_names is ['title'], return a list of 
    [{'id': <id>, 'title': <title>}]
    """
    _df = df.copy()
    _df.index.name = 'id'
    # the next line will return a list of dictionaries [{'id': <id>, 'title': <title>}]
    papers = _df[['title']].reset_index().astype(str).to_dict(orient='records')
    return papers

def set_node_attributes(G, 
                        df_papers, 
                        cl_sizes, 
                        collection_colnames, 
                        collection_attr_names=['collection_1', 'collection_2'],
                        size_threshold=0,
                        num_collection_papers_threshold=0):
    nodes_to_remove = []
    num_below_size_threshold = 0
    num_below_collection_papers_threshold = 0
    for node in G.nodes:
        papers_subset = df_papers[df_papers['cl_top']==node]
        if len(papers_subset) < num_collection_papers_threshold:
            nodes_to_remove.append(node)
            num_below_collection_papers_threshold += 1
            continue

        num_papers = cl_sizes[node]
        if num_papers < size_threshold:
            nodes_to_remove.append(node)
            num_below_size_threshold += 1
            continue

        G.nodes[node]['num_papers'] = str(cl_sizes[node])
        for i, collection_colname in enumerate(collection_colnames):
            df_this_collection = papers_subset[papers_subset[collection_colname]==1]
            papers = get_list_of_papers(df_this_collection, attr_names=['title'])
            G.nodes[node][collection_attr_names[i]] = papers
    G.remove_nodes_from(nodes_to_remove)
    if size_threshold:
        logger.debug("{} nodes removed because of cluster size threshold (threshold: {})".format(num_below_size_threshold, size_threshold))
    if num_collection_papers_threshold:
        logger.debug("{} nodes removed because of collection membership threshold (threshold: {})".format(num_below_collection_papers_threshold, num_collection_papers_threshold))
    return G

def write_to_json(G, outfname):
    json_data = json_graph.node_link_data(G)
    with open(outfname, 'w') as outf:
        json.dump(json_data, outf, cls=MyEncoder)


def main(args):
    df_papers = pd.read_csv(args.papers, sep='\t', index_col=0)
    df_linklist = pd.read_csv(args.linklist, sep='\t')
    cl_sizes = pd.read_csv(args.cl_size, sep='\t', index_col=0, squeeze=True)  # pandas Series

    G = nx.DiGraph()
    # first, add edges
    logger.debug('adding edges...')
    G.add_weighted_edges_from(df_linklist.values)

    # set node attributes
    logger.debug('adding node attributes...')
    G = set_node_attributes(G, df_papers, cl_sizes, collection_colnames=[args.name1, args.name2], size_threshold=0, num_collection_papers_threshold=2)

    logger.debug('number of nodes: {}'.format(G.number_of_nodes()))
    logger.debug('number of edges: {}'.format(G.number_of_edges()))
    logger.debug('sum of edge weights: {}'.format(G.size(weight='weight')))
    write_to_json(G, args.output)

if __name__ == "__main__":
    total_start = timer()
    logger = logging.getLogger(__name__)
    logger.info(" ".join(sys.argv))
    logger.info( '{:%Y-%m-%d %H:%M:%S}'.format(datetime.now()) )
    import argparse
    parser = argparse.ArgumentParser(description="prepare data for visualization")
    parser.add_argument("papers", help="TSV file with data for papers. There should be a column `title` and a column `cl_top`, and two columns to denote membership in the two collections (positive for membership should be either `True` or 1)")
    parser.add_argument("linklist", help="TSV file with linklist data (citation links between toplevel clusters that appear in `papers`), Should be three columns for source, target, and weight")
    parser.add_argument("cl_size", help="TSV file with the number of papers (total, not just in these collections) in the toplevel clusters")
    parser.add_argument("output", help="output JSON filename")
    parser.add_argument("--name1", default="collection_1", help="column name in `papers` to denote membership in the first collection")
    parser.add_argument("--name2", default="collection_2", help="column name in `papers` to denote membership in the second collection")
    parser.add_argument("--debug", action='store_true', help="output debugging info")
    global args
    args = parser.parse_args()
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug('debug mode is on')
    else:
        logger.setLevel(logging.INFO)
    main(args)
    total_end = timer()
    logger.info('all finished. total time: {}'.format(format_timespan(total_end-total_start)))
