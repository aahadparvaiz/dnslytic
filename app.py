from flask import Flask, render_template, request, jsonify
import dns.resolver
import dns.exception
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import re


app = Flask(__name__)


# ---------------------------------------------------------
# DNS RECORD CONFIGURATION
# ---------------------------------------------------------

RECORD_TYPES = [
    "A",
    "AAAA",
    "CAA",
    "CNAME",
    "MX",
    "NS",
    "TXT",
    "SOA"
]


RECORD_INFO = {

    "A": {
        "name": "IPv4 Address",
        "description": (
            "Connects a domain to an IPv4 address. "
            "This is one of the main ways DNS helps your browser "
            "find a website."
        )
    },

    "AAAA": {
        "name": "IPv6 Address",
        "description": (
            "Connects a domain to an IPv6 address. "
            "IPv6 is the newer version of the Internet Protocol "
            "used to identify devices and servers."
        )
    },

    "CAA": {
        "name": "Certificate Authority",
        "description": (
            "Specifies which Certificate Authorities are allowed "
            "to issue HTTPS certificates for this domain."
        )
    },

    "CNAME": {
        "name": "Canonical Name",
        "description": (
            "Points one domain name to another domain name. "
            "It is commonly used when different domain names "
            "should lead to the same destination."
        )
    },

    "MX": {
        "name": "Mail Server",
        "description": (
            "Tells email systems which mail servers are responsible "
            "for receiving email for this domain."
        )
    },

    "NS": {
        "name": "Name Server",
        "description": (
            "Shows the DNS servers responsible for managing "
            "DNS information for this domain."
        )
    },

    "TXT": {
        "name": "Text Information",
        "description": (
            "Stores text information in DNS. It is commonly used "
            "for domain verification, email security, SPF, "
            "and other services."
        )
    },

    "SOA": {
        "name": "Start of Authority",
        "description": (
            "Contains important administrative and timing "
            "information about the domain's DNS zone."
        )
    }
}


# ---------------------------------------------------------
# DOMAIN VALIDATION
# ---------------------------------------------------------

def validate_domain(domain):
    """
    Validate a domain name before performing DNS queries.
    """

    domain = domain.strip().lower()

    if not domain:
        return False

    if len(domain) > 253:
        return False

    # Allow domains such as:
    # example.com
    # sub.example.com
    #
    # Do not allow:
    # spaces
    # protocols
    # paths
    # ports
    # command-like input

    pattern = (
        r"^(?=.{1,253}$)"
        r"(?!-)"
        r"(?:[a-zA-Z0-9-]{1,63}\.)+"
        r"[a-zA-Z]{2,63}$"
    )

    return bool(re.match(pattern, domain))


# ---------------------------------------------------------
# DNS RESOLVER
# ---------------------------------------------------------

def create_resolver():
    """
    Create a DNS resolver with reasonable timeouts.
    """

    resolver = dns.resolver.Resolver()

    resolver.timeout = 2
    resolver.lifetime = 3

    return resolver


# ---------------------------------------------------------
# SINGLE DNS LOOKUP
# ---------------------------------------------------------

def lookup_record(domain, record_type):
    """
    Resolve one DNS record type.
    """

    resolver = create_resolver()

    try:

        answers = resolver.resolve(
            domain,
            record_type
        )

        records = []


        for answer in answers:

            # ---------------------------------------------
            # MX
            # ---------------------------------------------

            if record_type == "MX":

                records.append({
                    "priority": answer.preference,
                    "value": str(
                        answer.exchange
                    ).rstrip(".")
                })


            # ---------------------------------------------
            # SOA
            # ---------------------------------------------

            elif record_type == "SOA":

                records.append({

                    "mname": str(
                        answer.mname
                    ).rstrip("."),

                    "rname": str(
                        answer.rname
                    ).rstrip("."),

                    "serial": answer.serial,

                    "refresh": answer.refresh,

                    "retry": answer.retry,

                    "expire": answer.expire,

                    "minimum": answer.minimum

                })


            # ---------------------------------------------
            # CAA
            # ---------------------------------------------

            elif record_type == "CAA":

                tag = answer.tag

                value = answer.value

                if isinstance(tag, bytes):
                    tag = tag.decode(
                        errors="replace"
                    )

                if isinstance(value, bytes):
                    value = value.decode(
                        errors="replace"
                    )

                records.append({

                    "flags": answer.flags,

                    "tag": str(tag),

                    "value": str(value)

                })


            # ---------------------------------------------
            # TXT
            # ---------------------------------------------

            elif record_type == "TXT":

                parts = []

                for part in answer.strings:

                    if isinstance(part, bytes):
                        parts.append(
                            part.decode(
                                errors="replace"
                            )
                        )

                    else:
                        parts.append(
                            str(part)
                        )

                records.append(
                    "".join(parts)
                )


            # ---------------------------------------------
            # ALL OTHER TYPES
            # ---------------------------------------------

            else:

                records.append(
                    str(answer).rstrip(".")
                )


        return {
            "type": record_type,
            "records": records
        }


    except (
        dns.resolver.NoAnswer,
        dns.resolver.NXDOMAIN,
        dns.resolver.NoNameservers,
        dns.exception.Timeout
    ):

        return {
            "type": record_type,
            "records": []
        }


    except Exception:

        return {
            "type": record_type,
            "records": []
        }


# ---------------------------------------------------------
# CONCURRENT DNS LOOKUP
# ---------------------------------------------------------

def perform_dns_lookup(domain):
    """
    Perform multiple DNS lookups concurrently.
    """

    results = {}


    # Maximum number of simultaneous DNS queries.
    #
    # We only query our predefined record types,
    # so this remains controlled.

    with ThreadPoolExecutor(
        max_workers=len(RECORD_TYPES)
    ) as executor:

        futures = {

            executor.submit(
                lookup_record,
                domain,
                record_type
            ): record_type

            for record_type in RECORD_TYPES

        }


        for future in as_completed(futures):

            record_type = futures[future]

            try:

                result = future.result()

                if result["records"]:

                    results[
                        record_type
                    ] = result["records"]

            except Exception:

                # Do not allow one failed query
                # to break the entire lookup.

                continue


    # Preserve the original display order.

    ordered_results = {}

    for record_type in RECORD_TYPES:

        if record_type in results:

            ordered_results[
                record_type
            ] = results[record_type]


    return ordered_results


# ---------------------------------------------------------
# HOME PAGE
# ---------------------------------------------------------

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# ---------------------------------------------------------
# DNS API
# ---------------------------------------------------------

@app.route(
    "/api/lookup",
    methods=["GET"]
)
def dns_lookup():

    domain = request.args.get(
        "domain",
        ""
    ).strip().lower()


    # ---------------------------------------------
    # Validate input
    # ---------------------------------------------

    if not validate_domain(domain):

        return jsonify({

            "success": False,

            "error": (
                "Please enter a valid domain name "
                "such as example.com."
            )

        }), 400


    # ---------------------------------------------
    # Start timer
    # ---------------------------------------------

    start_time = time.perf_counter()


    # ---------------------------------------------
    # Perform DNS lookup
    # ---------------------------------------------

    results = perform_dns_lookup(
        domain
    )


    # ---------------------------------------------
    # Calculate response time
    # ---------------------------------------------

    elapsed_time = round(
        (
            time.perf_counter()
            - start_time
        ) * 1000,
        2
    )


    # ---------------------------------------------
    # Count records
    # ---------------------------------------------

    total_records = sum(
        len(records)
        for records in results.values()
    )


    # ---------------------------------------------
    # Return JSON
    # ---------------------------------------------

    return jsonify({

        "success": True,

        "domain": domain,

        "record_count": total_records,

        "response_time": elapsed_time,

        "records": results,

        "record_info": RECORD_INFO

    })


# ---------------------------------------------------------
# APPLICATION START
# ---------------------------------------------------------

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )
